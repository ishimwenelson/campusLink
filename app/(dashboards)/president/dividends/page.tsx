"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { 
  getDividendProjects, 
  createDividendProject, 
  updateDividendProject, 
  distributeDividends,
  getAllUsers 
} from "@/lib/firebase/firestore";
import { motion } from "framer-motion";
import { 
  TrendingUp, Plus, DollarSign, Calendar, Target, CheckCircle, 
  AlertCircle, Users, Briefcase, Award, Loader2, Eye 
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatRF, formatDate } from "@/lib/utils/format";
import type { DividendProject, CampusUser } from "@/lib/types";
import { toast } from "sonner";

export default function DividendManagement() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<DividendProject[]>([]);
  const [users, setUsers] = useState<CampusUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [distributing, setDistributing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalInvestment: "",
    totalIncome: "",
    category: "agriculture" as DividendProject['category'],
    status: "active" as DividendProject['status']
  });

  useEffect(() => {
    Promise.all([getDividendProjects(), getAllUsers()]).then(([p, u]) => {
      setProjects(p);
      setUsers(u);
      setLoading(false);
    });
  }, []);

  const totalInvestment = projects.reduce((sum, p) => sum + p.totalInvestment, 0);
  const totalIncome = projects.reduce((sum, p) => sum + p.totalIncome, 0);
  const totalProfit = projects.reduce((sum, p) => sum + p.profit, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const totalInvestmentNum = Number(formData.totalInvestment);
    const totalIncomeNum = Number(formData.totalIncome);

    if (!formData.name || !formData.description || totalInvestmentNum <= 0 || totalIncomeNum <= 0) {
      toast.error("Please fill all fields with valid amounts");
      return;
    }

    try {
      await createDividendProject({
        name: formData.name,
        description: formData.description,
        totalInvestment: totalInvestmentNum,
        totalIncome: totalIncomeNum,
        profit: totalIncomeNum - totalInvestmentNum,
        startDate: new Date().toISOString(),
        status: formData.status,
        category: formData.category,
        createdBy: profile.uid,
      });

      toast.success("Project created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        description: "",
        totalInvestment: "",
        totalIncome: "",
        category: "agriculture",
        status: "active"
      });
      
      // Refresh projects
      getDividendProjects().then(setProjects);
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleDistributeDividends = async (project: DividendProject) => {
    if (!project.profit || project.profit <= 0) {
      toast.error("No profit available to distribute");
      return;
    }

    setDistributing(project.id);
    try {
      const totalShares = users.reduce((sum, user) => sum + (user.totalShareValue / 1000), 0);
      const perShareAmount = project.profit / totalShares;
      
      await distributeDividends(project.id, perShareAmount);
      await updateDividendProject(project.id, { status: 'completed' });
      
      toast.success(`Dividends distributed successfully! ${formatRF(perShareAmount)} per share`);
      getDividendProjects().then(setProjects);
    } catch (error) {
      toast.error("Failed to distribute dividends");
    } finally {
      setDistributing(null);
    }
  };

  const getCategoryIcon = (category: DividendProject['category']) => {
    switch (category) {
      case 'agriculture': return '🌾';
      case 'real_estate': return '🏢';
      case 'business': return '💼';
      case 'infrastructure': return '🏗️';
      default: return '📊';
    }
  };

  const getStatusColor = (status: DividendProject['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-3xl text-stone-900">Dividend Management</h1>
          <p className="text-stone-500 text-sm mt-1">Manage investment projects and distribute profits</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
          >
            <Plus size={16} /> New Project
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={projects.length} icon={Briefcase} color="gold" delay={0.1} />
        <StatCard title="Total Investment" value={formatRF(totalInvestment)} icon={DollarSign} color="green" delay={0.15} />
        <StatCard title="Total Income" value={formatRF(totalIncome)} icon={TrendingUp} color="blue" delay={0.2} />
        <StatCard title="Total Profit" value={formatRF(totalProfit)} icon={Award} color="purple" delay={0.25} />
      </div>

      {/* Projects List */}
      <motion.div
        className="card-gold overflow-hidden"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <div className="p-5 border-b border-amber-50 flex items-center justify-between">
          <h2 className="font-display text-xl text-stone-900">Investment Projects</h2>
          <span className="badge-pending">{activeProjects} active</span>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            <Briefcase className="mx-auto mb-3 text-amber-400" size={32} />
            <p>No investment projects yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 text-amber-500 hover:text-amber-600 font-medium"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-amber-50">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-5 hover:bg-amber-50/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(project.category)}</span>
                      <div>
                        <h3 className="font-semibold text-stone-900">{project.name}</h3>
                        <p className="text-sm text-stone-500">{project.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-stone-400">Investment</p>
                        <p className="font-semibold text-stone-800">{formatRF(project.totalInvestment)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400">Income</p>
                        <p className="font-semibold text-green-600">{formatRF(project.totalIncome)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400">Profit</p>
                        <p className={`font-semibold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatRF(Math.abs(project.profit))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400">Started</p>
                        <p className="font-semibold text-stone-800">{formatDate(project.startDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    
                    {project.status === 'active' && project.profit > 0 && (
                      <button
                        onClick={() => handleDistributeDividends(project)}
                        disabled={distributing === project.id}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {distributing === project.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <DollarSign size={14} />
                        )}
                        Distribute
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-stone-900 mb-4">Create Investment Project</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Total Investment (RF)</label>
                  <input
                    type="number"
                    value={formData.totalInvestment}
                    onChange={(e) => setFormData({ ...formData, totalInvestment: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Expected Income (RF)</label>
                  <input
                    type="number"
                    value={formData.totalIncome}
                    onChange={(e) => setFormData({ ...formData, totalIncome: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as DividendProject['category'] })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="agriculture">Agriculture</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="business">Business</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as DividendProject['status'] })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
