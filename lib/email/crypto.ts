import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

function getKey(): Buffer {
  const key = process.env.EMAIL_ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error("EMAIL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
  }
  return Buffer.from(key, "hex")
}

export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`
}

export function decryptToken(ciphertext: string): string {
  const key = getKey()
  const parts = ciphertext.split(".")
  if (parts.length !== 3) throw new Error("Invalid token format")
  const [ivHex, tagHex, dataHex] = parts
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const data = Buffer.from(dataHex, "hex")
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data).toString("utf8") + decipher.final("utf8")
}
