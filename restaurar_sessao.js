const fs = require("fs");
const { execSync } = require("child_process");

const secret = "/etc/secrets/auth_session.txt";

if (fs.existsSync(secret) && !fs.existsSync("auth_info_baileys")) {
  const data = fs.readFileSync(secret, "utf8").trim();

  fs.writeFileSync(
    "auth_session.tar.gz",
    Buffer.from(data, "base64")
  );

  execSync("tar -xzf auth_session.tar.gz");

  console.log("✅ Sessão WhatsApp restaurada");
}
