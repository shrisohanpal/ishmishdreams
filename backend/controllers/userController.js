import nodemailer from 'nodemailer'
import asyncHandler from 'express-async-handler'
import randomstring from 'randomstring'
import generateToken from '../utils/generateToken.js'
import User from '../models/userModel.js'

// @desc    Auth user & get Token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) =>
{
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id)
        })
    } else {
        res.status(401)
        throw new Error('Invalid email or Password')
    }
})


// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) =>
{
    const { name, email, password } = req.body

    const userExists = await User.findOne({ email })

    if (userExists) {
        res.status(400)
        throw new Error('User Already exists!')
    }

    const user = await User.create({
        name, email, password
    })

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id)
        })
    } else {
        res.status(400)
        throw new Error('Invalid used data')
    }
})


// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) =>
{
    const user = await User.findById(req.user._id)

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
        })
    } else {
        res.status(404)
        throw new Error('User not found')
    }
})

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) =>
{
    const user = await User.findById(req.user._id)

    if (user) {
        user.name = req.body.name || user.name
        user.email = req.body.email || user.email
        if (req.body.password) {
            user.password = req.body.password
        }

        const updatedUser = await user.save()

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            token: generateToken(updatedUser._id)
        })

    } else {
        res.status(404)
        throw new Error('User not found')
    }
})



// @desc    Create new Password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const user = await User.findOne({ email })

  if (user) {
    const newPass = randomstring.generate(6)
    user.password = newPass
    await user.save()

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAILID,
        pass: process.env.GMAILIDPASS
      }
    });

    var mailOptions = {
      from: process.env.GMAILID,
      to: email,
      subject: 'RESET PASSWORD ON ISHMISHDREAMS',
      html: `Your new password is ${newPass}\n Please login with this Password and Change your password!`
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        res.status(401)
        throw new Error(error.message)
      } else {
        res.json({ message: 'New Password sent on your Email Address!' })
      }
    })
  } else {
    res.status(401)
    throw new Error('Invalid Email')
  }
})

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) =>
{
    const users = await User.find({})
    res.json(users)
})

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) =>
{
    const user = await User.findById(req.params.id)
    if (user) {
        await user.remove()
        res.json({ message: 'User removed' })
    } else {
        res.status(404)
        throw new Error('User not found')
    }
})


// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) =>
{
    const user = await User.findById(req.params.id).select('-password')
    if (user) {
        res.json(users)
    } else {
        res.status(404)
        throw new Error('User not found')
    }
})

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) =>
{
    const user = await User.findById(req.params.id)

    if (user) {
        user.name = req.body.name || user.name
        user.email = req.body.email || user.email
        user.isAdmin = req.body.isAdmin || user.isAdmin

        const updatedUser = await user.save()

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin
        })

    } else {
        res.status(404)
        throw new Error('User not found')
    }
})

export
{
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    forgotPassword,
    getUsers,
    deleteUser,
    getUserById,
    updateUser
}