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

export const generatePayUHash = (
  params: PayUHashParams,
  salt: string
): string => {
  // Formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
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
  ].join("|") + "||||||" + salt

  return crypto.createHash("sha512").update(hashString, "utf8").digest("hex")
}

export const verifyPayUHash = (
  payload: any,
  salt: string
): boolean => {
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
  const additional = payload.additional_charges ?? payload.additionalCharges ?? ""

  // Reverse Formula: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const base = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`

  const computed = crypto.createHash("sha512").update(base, "utf8").digest("hex").toLowerCase()
  
  if (computed === receivedHash) {
    return true
  }

  if (additional) {
    const withCharges = `${additional}|${base}`
    const computedWithCharges = crypto.createHash("sha512").update(withCharges, "utf8").digest("hex").toLowerCase()
    return computedWithCharges === receivedHash
  }

  return false
}