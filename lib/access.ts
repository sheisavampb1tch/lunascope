const FALLBACK_CODES = ["LUNA-ALPHA", "EDGE-01", "POLY-VIP"];

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export function getInviteCodes() {
  const envCodes = process.env.LUNASCOPE_INVITE_CODES
    ?.split(",")
    .map(normalizeCode)
    .filter(Boolean);

  return envCodes && envCodes.length > 0 ? envCodes : FALLBACK_CODES;
}

export function verifyInviteCode(code: string) {
  return getInviteCodes().includes(normalizeCode(code));
}

export function labelWallet(wallet: string) {
  if (wallet === "rabby") return "Rabby";
  if (wallet === "metamask") return "MetaMask";
  if (wallet === "walletconnect") return "WalletConnect";
  return "Wallet";
}
