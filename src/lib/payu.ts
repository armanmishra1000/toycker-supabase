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
  const {
    key, txnid, amount, productinfo, firstname, email,
    udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = ""
  } = params

  // PayU Formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString =
    [key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5].join("|") +
    "||||||" +
    salt

  return crypto.createHash("sha512").update(hashString, "utf8").digest("hex")
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
  
  // Base string construction starting from salt
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