# backend 

this is a backend for youtube like app using javascript

to add the watch history thing while we were creating model for user and video we use a package of mongoose which is
# mongoose-aggregate-paginate-v2
this helps us to write aggregate queries of mongoose

# bcrypt.js
this library is used for hashing the password so password problem is solved by this one

# jwt -> json web token
both brcypt and jwt are related  to cryptography

# jwt is a bearer token
this means that who so ever has access to this token i will send the data to that person

# using mongoose hooks like pre for encrypting the data or password before sending

# userSchema.pre("save", ) -> we dont use arrow function as callback inside it because
arrow function doesn't take reference of this and we will be needing reference of everything inside this callback so we use normal function as in "user.model.js"

# next keyword is used in case of middleware

# sessions and cookies both are being used in this project for security purpose
Access token is not stored in dtabase whereas refresh token is stored

# multer increases thing in request object and gives us access to req.files