/** Link mở sẵn tin nhắn. iOS dùng &body, Android dùng ?body */
export function smsHref(phone: string, body: string, userAgent = '') {
  const ios = /iPhone|iPad|iPod/i.test(userAgent)
  return `sms:${phone}${ios ? '&' : '?'}body=${encodeURIComponent(body)}`
}

export function isPhoneDevice(userAgent = '') {
  return /Android|iPhone|iPad|iPod/i.test(userAgent)
}
