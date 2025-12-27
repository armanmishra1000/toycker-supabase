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
  salt: string,
  saltV2?: string
): string => {
  const {
    key, txnid, amount, productinfo, firstname, email,
    udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = ""
  } = params

  // PayU Formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
  // Note: We join the first 11 fields (key...udf5) with pipes.
  // Then we append "||||||" which accounts for udf6-udf10 (5 empty fields) + the separator before salt.
  const getHashString = (s: string) => 
    [key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5].join("|") +
    "||||||" +
    s

  const v1 = crypto.createHash("sha512").update(getHashString(salt), "utf8").digest("hex")

  // For accounts requiring Enhanced Hash, we must return a JSON string.
  // If Salt V2 is not provided, we can't generate v2, but we should still try to match the format if required.
  // However, usually if V2 is required, you MUST have the V2 salt.
  if (saltV2) {
    const v2 = crypto.createHash("sha512").update(getHashString(saltV2), "utf8").digest("hex")
    return JSON.stringify({ v1, v2 })
  }

  // Fallback: If no Salt V2, checking if we are using the public test key 'gtKFFx' which enforces V2.
  // We can't fake V2, so we return V1. If this fails, the user MUST provide PAYU_MERCHANT_SALT_V2.
  return v1
}

export const verifyPayUHash = (
  payload: any,
  salt: string
): boolean => {
  const {
    status,
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
    key,
    hash,
    additionalCharges,
  } = payload

  // PayU Reverse Formula: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const commonString = `${salt}|${status}||||||${udf5 || ""}|${udf4 || ""}|${udf3 || ""}|${udf2 || ""}|${udf1 || ""}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`

  let hashString = ""
  if (additionalCharges) {
    hashString = `${additionalCharges}|${commonString}`
  } else {
    hashString = commonString
  }

  const generatedHash = crypto.createHash("sha512").update(hashString, "utf8").digest("hex")
  return generatedHash === hash
}