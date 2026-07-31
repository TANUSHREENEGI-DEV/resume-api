function checkAge(age) {
  return new Promise(function (resolve, reject) {
    if (age >= 18) {
      resolve("age check passed, user is an adult");
    } else {
      reject("age check failed, user is a minor");
    }
  });
}

// this one resolves
checkAge(21)
  .then(function (result) {
    console.log("success:", result);
  })
  .catch(function (error) {
    console.log("error:", error);
  });

// this one rejects
checkAge(15)
  .then(function (result) {
    console.log("success:", result);
  })
  .catch(function (error) {
    console.log("error:", error);
  });