const mongoose = require('mongoose'); 
const validator = require('validator'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
    name:{
        type: String, 
        required: [true, 'please enter your name'],

    },
    email:{
        type: String, 
        required: [true, 'please enter your email address'],
        unique: true, 
        validate: [validator.isEmail, 'please enter a valid email'],
    },
    role:{
        type: String, 
        enum:{
            values: ["user", "employeer"], 
            message: "please select correct role", 

        },
        default: 'user',
    },
    password:{
        type: String, 
        required: [true, 'please add a password'],
        minLength:[8, 'your password must be at least 8 charcaters lonbg'], 
        select: false, 

    },

    createdAt:{
        type: Date, 
        default: Date.now
    },

    resetPasswordToken: String, 
    resetPasswordExpired: Date, 

})

//encyption password
userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

//return json web token 

userSchema.methods.getJwtToken = function(){
    return jwt.sign(
        {
            id: this._id,
        },
            process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_TIME
        }
    )
}

//compare user password with database password;

userSchema.methods.comparePassword = async function(enterPassword){
    return await bcrypt.compare(enterPassword, this.password); 

}
userSchema.methods.getResetPasswordToken = function(){

    const resetToken = crypto.randomBytes(20).toString('hex'); 
    // Has and set to resetPasswordToken 

    this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); 

    // Set token expire time 
    this.resetPasswordExpire = Date.now() + 30*60*1000; 

    return resetToken; 

}

//  
userSchema.virtual('jobsPublished', {
    ref: 'Job', 
    localField: '_id', 
    foreignField: 'user', 
    justOne: false, 
})

module.exports = mongoose.model('User',userSchema);