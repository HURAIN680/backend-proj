import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
        },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshTokens: [{
        type: String
    }],
    watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video'
        }],
    coverImage: {
        type: String,
        default: ''
    },
    avatar:{
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    }

    },{ timestamps: true })


userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordMatch = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function() {
    jwt.sign(
        { userId: this._id,
          email: this.email,
          username: this.username,
          fullName: this.fullName

        },
        process.env.access_token_secret,
        { expiresIn: process.env.access_token_secret_expiresIn }

    )};
    

userSchema.methods.generateRefreshToken = function() {
    jwt.sign(
        { userId: this._id,
          email: this.email,
          username: this.username,
          fullName: this.fullName

        },
        process.env.refresh_token_secret,
        { expiresIn: process.env.refresh_token_secret_expiresIn }

    )};


export const User = mongoose.model('User', userSchema);