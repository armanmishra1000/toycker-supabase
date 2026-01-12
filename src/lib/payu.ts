import crypto from "crypto"

export interface PayUHashParams {
  key: string
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
}

/**
 * PayU Callback Payload Interface
 * Replaces the use of 'any' type for type safety
 */
export interface PayUCallbackPayload {
  status: string
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  key: string
  hash: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
  error_Message?: string
  additional_charges?: string
  additionalCharges?: string
  [key: string]: string | undefined
}

/**
 * Generate PayU Hash for payment request
 * 
 * PayU Hash Formula:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|SALT)
 * 
 * When udf2-udf10 are empty, this creates: key|...|udf1||||||||||SALT (10 empty pipes after udf1)
 */
export const generatePayUHash = (
  params: PayUHashParams,
  salt: string
): string => {
  // Build hash string with all parameters
  // PayU expects: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
  const hashString = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || "",
    params.udf2 || "",
    params.udf3 || "",
    params.udf4 || "",
    params.udf5 || "",
    "", // udf6 - empty
    "", // udf7 - empty
    "", // udf8 - empty
    "", // udf9 - empty
    "", // udf10 - empty
    salt
  ].join("|")

  // Debug logging (salt is masked for security)
  if (process.env.NODE_ENV === "development") {
    const debugString = hashString.replace(salt, "***SALT***")
    console.log("[PAYU] Hash string (masked):", debugString)
  }

  return crypto.createHash("sha512").update(hashString, "utf8").digest("hex")
}

/**
 * Verify PayU Response Hash (Reverse Hash)
 * 
 * PayU Response Hash Formula:
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * 
 * With additional charges:
 * sha512(additional_charges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export const verifyPayUHash = (payload: PayUCallbackPayload, salt: string): boolean => {
  const status = String(payload.status || "")
  const key = String(payload.key || "")
  const txnid = String(payload.txnid || "")
  const amount = String(payload.amount || "")
  const productinfo = String(payload.productinfo || "")
  const firstname = String(payload.firstname || "")
  const email = String(payload.email || "")

  const udf1 = String(payload.udf1 || "")
  const udf2 = String(payload.udf2 || "")
  const udf3 = String(payload.udf3 || "")
  const udf4 = String(payload.udf4 || "")
  const udf5 = String(payload.udf5 || "")

  const receivedHash = String(payload.hash || "").toLowerCase()

  // PayU might send this as 'additional_charges' or 'additionalCharges'
  const additional = payload.additional_charges ?? payload.additionalCharges ?? ""

  // Reverse Formula: salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  // When udf6-udf10 are empty: salt|status|||||udf5|udf4|udf3|udf2|udf1|email|...
  const base = [
    salt,
    status,
    "", // udf10 - empty
    "", // udf9 - empty
    "", // udf8 - empty
    "", // udf7 - empty
    "", // udf6 - empty
    udf5,
    udf4,
    udf3,
    udf2,
    udf1,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key
  ].join("|")

  const computed = crypto.createHash("sha512").update(base, "utf8").digest("hex").toLowerCase()

  // Debug logging
  if (process.env.NODE_ENV === "development") {
    const debugBase = base.replace(salt, "***SALT***")
    console.log("[PAYU] Verify hash string (masked):", debugBase)
    console.log("[PAYU] Computed hash:", computed.substring(0, 20) + "...")
    console.log("[PAYU] Received hash:", receivedHash.substring(0, 20) + "...")
  }

  if (computed === receivedHash) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PAYU] Hash verification: PASSED")
    }
    return true
  }

  // Try with additional charges if present
  if (additional) {
    const withCharges = `${additional}|${base}`
    const computedWithCharges = crypto.createHash("sha512").update(withCharges, "utf8").digest("hex").toLowerCase()
    console.log("[PAYU] Trying with additional_charges:", additional)
    if (computedWithCharges === receivedHash) {
      console.log("[PAYU] Hash verification with charges: PASSED")
      return true
    }
  }

  console.log("[PAYU] Hash verification: FAILED")
  return false
}