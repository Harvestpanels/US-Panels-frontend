const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateForm(data) {
  const errors = {};
  const name = data.get("name")?.toString().trim() ?? "";
  const email = data.get("email")?.toString().trim() ?? "";
  const phone = data.get("phone")?.toString().trim() ?? "";
  const phoneDigits = phone.replace(/\D/g, "");

  if (!name) errors.name = "Name is required.";
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) errors.email = "Enter a valid email address.";
  if (!phone) errors.phone = "Phone number is required.";
  else if (phoneDigits.length < 10 || phoneDigits.length > 15) errors.phone = "Enter a valid phone number.";

  return errors;
}
