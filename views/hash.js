const bcrypt = require('bcrypt');

let password = 'abc';

bcrypt.hash(password, 5, (err, hashedPassword) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Original Password:', password);
    console.log('Hashed Password:', hashedPassword);
  }
});