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

  // Formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
  const getHashString = (s: string) => 
    [key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5].join("|") +
    "||||||" +
    s

  const v1 = crypto.createHash("sha512").update(getHashString(salt), "utf8").digest("hex")

  if (saltV2) {
    const v2 = crypto.createHash("sha512").update(getHashString(saltV2), "utf8").digest("hex")
    return JSON.stringify({ v1, v2 })
  }

  return v1
}

export const verifyPayUHash = (
  payload: any,
  salt: string
): boolean => {
  const {
    status,
    udf10 = "",
    udf9 = "",
    udf8 = "",
    udf7 = "",
    udf6 = "",
    udf5 = "",
    udf4 = "",
    udf3 = "",
    udf2 = "",
    udf1 = "",
    email = "",
    firstname = "",
    productinfo = "",
    amount = "",
    txnid = "",
    key = "",
    hash = "",
    additionalCharges = "",
  } = payload

  // Reverse Formula: salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  // Some implementations use 5 empty fields for udf6-10 if not present.
  const hashSequence = [
    udf10, udf9, udf8, udf7, udf6, udf5, udf4, udf3, udf2, udf1, 
    email, firstname, productinfo, amount, txnid, key
  ].join("|")

  const hashString = `${salt}|${status}|${hashSequence}`
  const generatedHash = crypto.createHash("sha512").update(hashString, "utf8").digest("hex")

  // If standard verification fails, check with additionalCharges prefix (common for some gateway modes)
  if (generatedHash !== hash && additionalCharges) {
    const chargeHashString = `${additionalCharges}|${hashString}`
    const generatedChargeHash = crypto.createHash("sha512").update(chargeHashString, "utf8").digest("hex")
    return generatedChargeHash === hash
  }

  return generatedHash === hash
}