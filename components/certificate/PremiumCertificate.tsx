"use client";
import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatRF } from "@/lib/utils/format";
import type { CampusUser } from "@/lib/types";

interface PremiumCertificateProps {
  profile: CampusUser;
  date?: string;
}

export const PremiumCertificate = forwardRef<HTMLDivElement, PremiumCertificateProps>(
  ({ profile, date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) }, ref) => {
    const shares = Math.floor(profile.totalShareValue / 1000);
    const certId = `CL-${profile.uid.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    return (
      <>
        {/* Font Imports */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Open+Sans:wght@400;600;700&display=swap');
          
          .cert-container {
            width: 1050px;
            height: 740px;
            position: relative;
            background: #e8e0d0;
            overflow: hidden;
            font-family: 'EB Garamond', Georgia, serif;
            color: #2a2a2a;
          }

          .cert-bg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
          }

          .cert-content {
            position: absolute;
            inset: 0;
            z-index: 10;
          }

          .logo-block {
            position: absolute;
            top: 70px;
            right: 80px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-img {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            object-fit: cover;
          }
          .logo-text {
            text-align: left;
            line-height: 1.15;
          }
          .logo-text .brand {
            font-family: "Helvetica", Arial, sans-serif;
            font-weight: 900;
            font-size: 22px;
            color: #c8a84b;
            letter-spacing: 1px;
            display: block;
          }
          .logo-text .sub {
            font-family: 'Open Sans', sans-serif;
            font-size: 13px;
            color: #d4b97a;
            letter-spacing: 0.5px;
            display: block;
          }

          .cert-title {
            position: absolute;
            top: 270px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 32px;
            font-family: "Helvetica", Arial, sans-serif;
            font-weight: 900;
            color: #8c6a1d;
            letter-spacing: 4px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }

          .top-line {
            position: absolute;
            top: 285px;
            left: 50%;
            transform: translateX(-50%);
            width: 460px;
          }

          .cert-body {
            position: absolute;
            top: 360px;
            left: 180px;
            right: 180px;
            text-align: center;
          }
          .cert-body p {
            font-size: 22px;
            line-height: 1.8;
            margin-bottom: 24px;
          }
          .name-placeholder {
            font-style: italic;
            font-family: 'EB Garamond', serif;
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            border-bottom: 1px solid #c8a84b;
            padding: 0 10px;
          }
          .gold-bold {
            color: #b8860b;
            font-weight: 700;
          }

          .cert-footer-row {
            position: absolute;
            top: 540px;
            left: 180px;
            right: 180px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .cert-footer-row .label {
            font-size: 19px;
          }
          .cert-footer-row .label strong {
            font-weight: 700;
          }

          .bottom-left, .bottom-right {
            position: absolute;
            bottom: 50px;
            width: 280px;
            height: auto;
          }
          .bottom-left { left: 80px; }
          .bottom-right { right: 80px; }

          .bottom-center {
            position: absolute;
            bottom: 45px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
          }
          .bottom-center .brand {
            font-family: "Helvetica", Arial, sans-serif;
            font-weight: 900;
            font-size: 24px;
            color: #8c6a1d;
            letter-spacing: 1.5px;
            display: block;
          }
          .bottom-center .sub {
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
            color: #8c6a1d;
            display: block;
          }

          .qr-code-block {
            position: absolute;
            bottom: 80px;
            right: 70px;
            text-align: center;
            background: rgba(255, 255, 255, 0.8);
            padding: 10px;
            border-radius: 12px;
            backdrop-blur: 4px;
            border: 1px solid #d4b97a20;
          }
          .qr-label {
            font-size: 9px;
            color: #8c6a1d;
            margin-top: 6px;
            font-family: 'Open Sans', sans-serif;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
        ` }} />

        <div ref={ref} className="cert-container" id="premium-certificate">
          {/* Background */}
          <img className="cert-bg" src="/images/bg.jpg" alt="" />

          <div className="cert-content">
            {/* Logo top right */}
            <div className="logo-block">
              <img className="logo-img" src="/images/logo.png" alt="Logo" />
              <div className="logo-text">
                <span className="brand">CAMPUSLINK</span>
                <span className="sub">Investment Association</span>
              </div>
            </div>

            {/* Main Title */}
            <h1 className="cert-title">COMPLETION CERTIFICATE</h1>

            {/* Top ornament line */}
            <img className="top-line" src="/images/top line.png" alt="" />

            {/* Body paragraphs */}
            <div className="cert-body">
              <p>
                This is to certify that <span className="name-placeholder">{profile.fullName}</span> has completed
                contribution of shares of <span className="name-placeholder">{shares} Units</span> and is now
                officially recognized as a member of <span className="gold-bold">Campus Link.</span>
              </p>
              <p>
                We appreciate your support and commitment to the <span className="gold-bold">Campus Link</span> community.
              </p>
            </div>

            {/* Date & Signature */}
            <div className="cert-footer-row">
              <span className="label"><strong>Date:</strong> {date}</span>
              <div className="flex flex-col items-center">
                <div className="w-48 h-px bg-[#b8860b] mb-2" />
                <span className="label"><strong>President Signature</strong></span>
              </div>
            </div>

            {/* Decorations */}
            <img className="bottom-left" src="/images/bottom line.png" alt="" />
            <img className="bottom-right" src="/images/bottom line.png" alt="" style={{ transform: 'scaleX(-1)' }} />

            {/* Bottom center branding */}
            <div className="bottom-center">
              <span className="brand">CAMPUSLINK</span>
              <span className="sub">Investment Association</span>
            </div>

            {/* QR Code bottom right */}
            <div className="qr-code-block">
              <QRCodeSVG
                value={`https://campuslink.com/verify/${profile.uid}`}
                size={80}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>
        </div>
      </>
    );
  }
);

PremiumCertificate.displayName = "PremiumCertificate";
