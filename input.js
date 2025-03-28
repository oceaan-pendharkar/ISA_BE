//ChatGPT was used to assist with this file

export function validateInput(input) {
  console.log("validating: " + input);

  if (typeof input !== "string") {
    throw new Error("Invalid input type.");
  }

  // Basic SQL injection prevention regex
  // The symbols at the end are for single line comment, multiline comments, ; and ' (common used symbols in SQL)
  const sqlInjectionRegex =
    /(\b(SELECT|INSERT|DELETE|UPDATE|DROP|ALTER|CREATE|UNION|EXEC|MERGE|HAVING|TRUNCATE)\b)|(--|\/\*|\*\/|;|')/gi;

  // Block suspicious patterns
  if (sqlInjectionRegex.test(input)) {
    // generic error thrown for security reasons
    throw new Error();
  }
}

export function validateEmail(email) {
  console.log("validating email: " + email);
  //starts with one or more chars that are not space or @
  //contains @ after that
  //then has another 1+ non space or @ chars
  //then has a . (dot)
  //then ends with 1 or more chars that are not space or @
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format.");
  }
}

export function validateWord(word) {
  console.log("validating word: " + word);
  const wordRegex = /[a-zA-Z]+/;
  if (!wordRegex.test(word)) {
    throw new Error("Invalid word format.");
  }
}

export function validateNumber(num) {
  console.log("validating number: " + num);
  const numRegex = /[0-9]+/;
  if (!numRegex.test(num)) {
    throw new Error("Invalid number format.");
  }
}
