//ChatGPT was used to assist with this file

export function validateInput(input) {
  console.log("validating: " + input);
  //   throw new Error();
}

export function validateEmail(email) {
  console.log("validating email: " + email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format.");
  }
}
