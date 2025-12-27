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
  // Standard PayU hash requires exactly 6 pipes between the last UDF and the SALT.
  
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

  const hashSequence = [
    udf10, udf9, udf8, udf7, udf6, udf5, udf4, udf3, udf2, udf1, 
    email, firstname, productinfo, amount, txnid, key
  ].join("|")

  const hashString = `${salt}|${status}|${hashSequence}`
  const generatedHash = crypto.createHash("sha512").update(hashString, "utf8").digest("hex")

  if (generatedHash !== hash && additionalCharges) {
    const chargeHashString = `${additionalCharges}|${hashString}`
    const generatedChargeHash = crypto.createHash("sha512").update(chargeHashString, "utf8").digest("hex")
    return generatedChargeHash === hash
  }

  return generatedHash === hash
}