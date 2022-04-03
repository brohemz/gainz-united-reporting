// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, doc } from "firebase/firestore";
import http from 'http';
import { fileURLToPath } from "url";
import express from 'express';
import path from 'path';
import { dirname } from "path";

// import { app } from './app'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCf928TWphVxuTd_R-Mz8MslDdM-TFBaLc",
  authDomain: "gainzunited-testing.firebaseapp.com",
  projectId: "gainzunited-testing",
  storageBucket: "gainzunited-testing.appspot.com",
  messagingSenderId: "759742464243",
  appId: "1:759742464243:web:dad1254a4b6e0c8d6ff786",
  measurementId: "G-J3HSKMEFK1"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const db = getFirestore(firebase);

async function getUsers(db) {
    const userCol = collection(db, 'users');
    const userSnapshot = await getDocs(userCol);
    const userList = userSnapshot.docs.map(document => document.data());
    return userList;
}

async function getReportedPosts(db) {
    const reportedPostsCol = collection(db, 'reportedPosts')
    const snapshot = await getDocs(reportedPostsCol);
    const postList = snapshot.docs.map(document => document.data());
    const numberOfReports = new Set()
    postList.forEach(post => numberOfReports[post.uid] = post.user_list.length);

    const postDataList = postList.map(document => (getDoc(doc(db, `posts`, document.uid))))

    return [(await Promise.all(postDataList)).map(document => document.data()), numberOfReports];
}

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

const app = express();
app.set("port", port);
app.set('view engine', 'ejs')

app.listen(port, () => console.log(`GainzUnited-Web listening on port ${port}.`));

app.get('/', (req, res) => {

  getReportedPosts(db).then( (posts) => {
    console.log(posts)
    return res.render('home', {
      data: "Hello world",
      numberOfReports: posts[1],
      reportedPosts: posts[0],
      reportedComments: posts[0],
      layout: './layouts/home'})
  })
})

// app.get('/', (req, res) => {
//   "Hello"
// })
