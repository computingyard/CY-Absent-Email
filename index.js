const firebase = require("firebase")
const nodemailer = require("nodemailer");

const firebaseConfig = {
  apiKey: process.env.APIKEY,
  authDomain: process.env.AUTHDOMAIN,
  databaseURL: process.env.DATABASEURL,
  projectId: process.env.PROJECTID,
  storageBucket: process.env.STORAGEBUCKET,
  messagingSenderId: process.env.MESSAGINGSENDERID,
  appId: process.env.APPID,
  measurementId: process.env.MEASUREMENTID
};

firebase.initializeApp(firebaseConfig)

var currentYear = new Date().getFullYear()
var currentMonth = new Date().getMonth();
currentMonth = currentMonth + 1
let date = new Date().getDate()
let today = currentMonth + "-" + date + "-" + currentYear


exports.handler = (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    }
  });
    console.log('API called for Marking absent for ', today)

     firebase.database().ref("/Attendance").once("value", (res) => {
      const attendanceObj = res.val() // complete attendance data
      firebase.database().ref("/Users").once("value", (res) => {
        const users = res.val() //all users data
        let userUids = [];
        Object.values(users).map((item, index) => {
          if (item.isVerified && item.role === "Authorized") {
            userUids.push(item.uid) // filtered verified and excluded admin and unverified users data
          }
        })
        userUids && userUids.map(async (uid, index) => {
          if (attendanceObj[uid] && attendanceObj[uid][currentYear] && attendanceObj[uid][currentYear][currentMonth] && (attendanceObj[uid][currentYear][currentMonth][today]) && (attendanceObj[uid][currentYear][currentMonth][today] !== "Absent") ) {
            // console.log(`Mr ${users[uid].firstName} ${' '} ${users[uid].lastName} , vide UID # ${uid} is present`)
          } else if (!attendanceObj[uid] || (attendanceObj[uid] && !(attendanceObj[uid][currentYear] && attendanceObj[uid][currentYear][currentMonth] && attendanceObj[uid][currentYear][currentMonth][today] && attendanceObj[uid][currentYear][currentMonth][today]["checkedin"]) && users[uid]["weekEnd"] === todayDay )) {
            // console.log(`Mr ${users[uid].firstName} ${users[uid].lastName}, vide UID # ${uid} is on weekend today : ${today} ${todayDay}`)
            firebase.database().ref(`/Attendance/${uid}/${currentYear}/${currentMonth}/${today}`).set("Holiday")
          } else if (!attendanceObj || (!attendanceObj[uid] || !attendanceObj[uid][currentYear] || !attendanceObj[uid][currentYear][currentMonth] || !(attendanceObj[uid][currentYear][currentMonth][today] && !attendanceObj[uid][currentYear][currentMonth][today] !== "Absent"))) {
            console.log(`Mr ${users[uid].firstName} ${users[uid].lastName} , vide UID # ${uid} is Absent today : ${today} ${todayDay}`)
            await transporter.sendMail({
              from:process.env.USER,
              to: users[uid].email, // list of receivers
              subject: `Absent Alert - ${users[uid].firstName} ${' '} ${users[uid].lastName} Attendance Management System - Computing Yard `, // Subject line
              html: `<b>Dear ${users[uid].firstName} ${' '} ${users[uid].lastName} , You are absent ${today}<br/><br/><br/><br/><br/><br/>





                  <br/>
                  REGARDS,<br/>
                  COMPUTING YARD<br/>
                  ATTENDANCE MANAGEMENT SYSTEM <br/>
                  `, // html body
            });
            firebase.database().ref(`/Attendance/${uid}/${currentYear}/${currentMonth}/${today}`).set("Absent")
          }
      })
    })
  })

};