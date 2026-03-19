"use client";
import {
  Document, Page, Text, View, StyleSheet, Image as PDFImage, Font,
} from "@react-pdf/renderer";
import type { CampusUser } from "@/lib/types";
import { getShareCount, BUSINESS_RULES } from "@/lib/types";

// Register fonts
Font.register({
  family: "Playfair",
  fonts: [
    { src: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3.ttf" },
    { src: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYh5o.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fffbeb",
    padding: 0,
    fontFamily: "Helvetica",
  },
  goldBorder: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    border: "12px solid #d97706",
  },
  innerBorder: {
    position: "absolute",
    top: 16, left: 16, right: 16, bottom: 16,
    border: "2px solid #f59e0b",
  },
  content: {
    padding: 60,
    alignItems: "center",
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  orgName: {
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 22,
    color: "#92400e",
    textAlign: "center",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 10,
    color: "#b45309",
    textAlign: "center",
    marginBottom: 24,
    fontStyle: "italic",
  },
  divider: {
    width: "80%",
    height: 1,
    backgroundColor: "#d97706",
    marginBottom: 24,
  },
  certificateTitle: {
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 36,
    color: "#78350f",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 2,
  },
  certificateSubtitle: {
    fontSize: 12,
    color: "#a16207",
    textAlign: "center",
    marginBottom: 32,
    letterSpacing: 1,
  },
  certifyText: {
    fontSize: 12,
    color: "#57534e",
    textAlign: "center",
    marginBottom: 8,
  },
  memberName: {
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 32,
    color: "#1c1917",
    textAlign: "center",
    marginBottom: 16,
    borderBottom: "1.5px solid #d97706",
    paddingBottom: 8,
    width: "80%",
  },
  detailText: {
    fontSize: 13,
    color: "#44403c",
    textAlign: "center",
    marginBottom: 6,
    lineHeight: 1.6,
  },
  amountHighlight: {
    color: "#b45309",
    fontWeight: 700,
  },
  infoBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    marginTop: 28,
    marginBottom: 28,
  },
  infoItem: {
    alignItems: "center",
    padding: 12,
    border: "1px solid #fde68a",
    borderRadius: 8,
    backgroundColor: "#fffdf5",
    minWidth: 120,
  },
  infoLabel: {
    fontSize: 9,
    color: "#a16207",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: "Playfair",
    fontSize: 16,
    color: "#92400e",
    fontWeight: 700,
  },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginTop: 32,
  },
  signature: {
    alignItems: "center",
  },
  signatureLine: {
    width: 140,
    height: 1,
    backgroundColor: "#1c1917",
    marginBottom: 6,
  },
  signatureTitle: {
    fontSize: 11,
    color: "#44403c",
    fontWeight: 700,
  },
  signatureRole: {
    fontSize: 9,
    color: "#78716c",
  },
  serialNumber: {
    position: "absolute",
    bottom: 30,
    right: 50,
    fontSize: 8,
    color: "#d6d3d1",
  },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "50%",
    fontSize: 80,
    color: "#fef3c7",
    fontFamily: "Playfair",
    opacity: 0.3,
    transform: "rotate(-30deg) translate(-50%, -50%)",
  },
});

interface CertificateProps {
  user: CampusUser;
}

export function ShareCertificate({ user }: CertificateProps) {
  const shares = getShareCount(user.totalShareValue);
  const startYear = new Date(user.createdAt as string).getFullYear();
  const endYear = startYear + BUSINESS_RULES.PAYMENT_YEARS - 1;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Borders */}
        <View style={styles.goldBorder} />
        <View style={styles.innerBorder} />

        {/* Watermark */}
        <Text style={styles.watermark}>PAID</Text>

        <View style={styles.content}>
          {/* Logo */}
          <PDFImage src="/assets/icon.png" style={styles.logo} />

          <Text style={styles.orgName}>CampusLink Investment Association</Text>
          <Text style={styles.tagline}>"Together we grow – Share, Save, Succeed"</Text>

          <View style={styles.divider} />

          <Text style={styles.certificateTitle}>SHARE CERTIFICATE</Text>
          <Text style={styles.certificateSubtitle}>CERTIFICATE OF FULL PAYMENT</Text>

          <Text style={styles.certifyText}>This is to certify that</Text>

          <Text style={styles.memberName}>{user.fullName.toUpperCase()}</Text>

          <Text style={styles.detailText}>
            has successfully completed full payment of{" "}
            <Text style={styles.amountHighlight}>{(user.totalShareValue >= 1_000_000 ? (user.totalShareValue / 1_000_000).toFixed(user.totalShareValue % 1_000_000 === 0 ? 0 : 1) + "M" : (user.totalShareValue / 1_000).toFixed(0) + "k")} RF</Text>
          </Text>
          <Text style={styles.detailText}>
            representing ownership of{" "}
            <Text style={styles.amountHighlight}>{shares.toLocaleString()} shares</Text>{" "}
            at 1,000 RF per share
          </Text>

          {/* Info boxes */}
          <View style={styles.infoBox}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Total Shares</Text>
              <Text style={styles.infoValue}>{shares.toLocaleString()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Total Value</Text>
              <Text style={styles.infoValue}>{(user.totalShareValue >= 1_000_000 ? (user.totalShareValue / 1_000_000).toFixed(user.totalShareValue % 1_000_000 === 0 ? 0 : 1) + "M" : (user.totalShareValue / 1_000).toFixed(0) + "k")} RF</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Period</Text>
              <Text style={styles.infoValue}>{startYear}–{endYear}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Completed</Text>
              <Text style={styles.infoValue}>{new Date().getFullYear()}</Text>
            </View>
          </View>

          {/* Signatures */}
          <View style={styles.signaturesRow}>
            <View style={styles.signature}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureTitle}>Member Signature</Text>
              <Text style={styles.signatureRole}>{user.fullName}</Text>
            </View>
            <View style={styles.signature}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureTitle}>President</Text>
              <Text style={styles.signatureRole}>CampusLink Investment Association</Text>
            </View>
          </View>
        </View>

        <Text style={styles.serialNumber}>
          Serial: CL-{user.uid.slice(0, 8).toUpperCase()}-{new Date().getFullYear()}
        </Text>
      </Page>
    </Document>
  );
}
