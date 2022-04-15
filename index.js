// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import http from 'http';
import { fileURLToPath } from "url";
import express from 'express';
import path from 'path';
import { dirname } from "path";

// import { app } from './app'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_MODE = false;

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseTestConfig = {
  apiKey: "AIzaSyCf928TWphVxuTd_R-Mz8MslDdM-TFBaLc",
  authDomain: "gainzunited-testing.firebaseapp.com",
  projectId: "gainzunited-testing",
  storageBucket: "gainzunited-testing.appspot.com",
  messagingSenderId: "759742464243",
  appId: "1:759742464243:web:dad1254a4b6e0c8d6ff786",
  measurementId: "G-J3HSKMEFK1"
};

const firebaseConfig = {
  apiKey: "AIzaSyDKaX4dg26DTPEkDA-shjwyZO0Ll8SHmsI",
  authDomain: "gainzunited-stage.firebaseapp.com",
  projectId: "gainzunited-stage",
  storageBucket: "gainzunited-stage.appspot.com",
  messagingSenderId: "361773161795",
  appId: "1:361773161795:web:f1e74204bf860ebe4be3f6",
  measurementId: "G-W50Y5876D0"
}

// Initialize Firebase
const firebase = initializeApp(TEST_MODE ? firebaseTestConfig : firebaseConfig);
// const analytics = getAnalytics(app);

const db = getFirestore(firebase);

// sign in
const auth = getAuth(firebase)
signInWithEmailAndPassword(auth, "admin@gainzunited.com", "admin@gainzunited12345")
  .then(() => console.log("Admin signed in!"))
  .catch(console.log)

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

    const reasonList = new Set()
    postList.forEach(post => reasonList[post.uid] = post.reason_list[0])

    const postDataList = postList.map(document => (getDoc(doc(db, `posts`, document.uid))))

    return [(await Promise.all(postDataList)).map(document => document.data()), numberOfReports, reasonList];
}

async function getReportedComments(db) {
  const reportedCommentsCol = collection(db, 'reportedComments')
  const snapshot = await getDocs(reportedCommentsCol);
  let commentList = snapshot.docs.map(document => document.data());

  const numberOfReports = new Set()
  commentList.forEach(comment => numberOfReports[comment.uid] = comment.user_list.length);

  const reasonList = new Set()
  commentList.forEach(comment => reasonList[comment.uid] = comment.reason_list[0])

  // let filterSet = new Map()
  // commentList.map(async comment => {
  //   let doc = getDocs(query(collection(db, 'comments'), where("index_map", "array-contains", comment.uid)))
  //   filterSet.set(comment.uid, doc);
  // });

  // filterSet = await Promise.all(filterSet)

  // filterSet.forEach(console.log)

  // let returnArray = []

  // filterSet.forEach((key, val) => {
  //   let ret = val.map(commentSnapshot => commentSnapshot.docs.map(docu => docu.data())).map(docData => {
  //     let obj = docData.list.filter(listVal => listVal.commentUID === key)[0]
  //     return {
  //       ...obj,
  //       postUID: docData.uid
  //     }
  //   })
  //   console.log(ret)
  //   returnArray.push(ret[0])
  // })

  // return [returnArray, numberOfReports, reasonList];;

  let filterList = []

  const commentQuery = commentList.map(comment => {
    filterList.push(comment.uid);
    console.log(comment.uid)
    return query(collection(db, 'comments'), where("index_map", "array-contains", comment.uid)) })
    .map(commentRef => getDocs(commentRef))

  let commentFinally = await Promise.all(commentQuery)

  var i = 0;

  if(commentFinally) {
    commentFinally = commentFinally.map(commentSnapshot => commentSnapshot.docs.map(docu => docu.data()).map(docData => {

      let obj = docData.list.filter(listVal => filterList.includes(listVal.commentUID))[i]
      i++;
      
      return { 
        ...obj,
        postUID: docData.uid
      }
    })).map(val => val[0])

  } else {
    commentFinally = []
  }

  return [commentFinally, numberOfReports, reasonList];
}

async function getReportedProfiles(db) {
  const reportedProfilesCol = collection(db, 'reportedUserProfiles')
  const snapshot = await getDocs(reportedProfilesCol);
  let profileList = snapshot.docs.map(document => document.data());

  const numberOfReports = new Set()
  profileList.forEach(profile => numberOfReports[profile.uid] = profile.user_list.length);

  const reasonList = new Set()
  profileList.forEach(profile => reasonList[profile.uid] = profile.reason_list[0]);

  let profileDataList = profileList.map(document => (getDoc(doc(db, `users`, document.uid))));

  return [(await Promise.all(profileDataList)).map(document => document.data()), numberOfReports, reasonList];
}

// Endpoint Actions
async function ignoreReportedPost(db, postUID) {
  const reportedPostRef = doc(collection(db, 'reportedPosts'), postUID)
  await deleteDoc(reportedPostRef);
}

async function removeReportedPost(db, postUID) {
  const reportedPostRef = doc(collection(db, 'reportedPosts'), postUID)
  await deleteDoc(reportedPostRef);

  const postRef = doc(collection(db, 'posts'), postUID)
  await deleteDoc(postRef)

  const commentRef = doc(collection(db, 'comments'), postUID)
  await deleteDoc(commentRef)

  const likesQuery = query(collection(db, 'likes'), where('postUID', '==', postUID))
  (await getDocs(likesQuery)).forEach(deleteDoc)
}

async function ignoreReportedComment(db, commentUID) {
const reportedCommentRef = doc(collection(db, 'reportedComments'), commentUID)
await deleteDoc(reportedCommentRef);
}

async function removeReportedComment(db, commentUID, postUID) {
  const reportedCommentRef = doc(collection(db, 'reportedComments'), commentUID)
  await deleteDoc(reportedCommentRef);
  console.log(postUID)
  const commentRef = doc(collection(db, 'comments'), postUID);
  const originalCommentAggregate = await getDoc(commentRef);
  const comment = originalCommentAggregate.data();
  const newCommentAggreggate = {
    'index_map': comment.index_map.filter(val => val !== commentUID),
    'list': comment.list.filter(val => val.commentUID !== commentUID),
    'uid': postUID
  }
  await updateDoc(commentRef, newCommentAggreggate);
}

async function ignoreReportedProfile(db, profileUID) {
  const reportedProfileRef = doc(collection(db, 'reportedUserProfiles'), profileUID)
  await deleteDoc(reportedProfileRef);
}

// doesn't remove - actually writes over profile
async function removeReportedProfile(db, profileUID) {
  const reportedProfileRef = doc(collection(db, 'reportedUserProfiles'), profileUID)
  await deleteDoc(reportedProfileRef);

  // Wipe profile data
  const userRef = doc(collection(db, 'users'), profileUID)
  await updateDoc(userRef, {
    'first_name': 'User',
    'last_name': 'Reported',
    'bio': "Reported!",
    'description': "Please watch what you write."
  })

  // TODO: remove profile pic from storage
  // FIXME: allow permissions for web
}

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

const app = express();
app.set("port", port);
app.set('view engine', 'ejs')

app.use(express.static(path.join(__dirname, 'client')));

app.listen(port, () => console.log(`GainzUnited-Web listening on port ${port}.`));

app.get('/', async (req, res) => {

  let posts = await getReportedPosts(db);
  let comments = await getReportedComments(db);
  let profiles = await getReportedProfiles(db);

  console.log("comments", comments[0])

  return res.render('home', {
    data: "Hello world",
    numberOfPostReports: posts[1],
    numberOfCommentReports: comments[1],
    numberOfProfileReports: profiles[1],
    postReasonList: posts[2],
    commentReasonList: comments[2],
    profileReasonList: profiles[2],
    reportedPosts: posts[0],
    reportedComments: comments[0],
    reportedProfiles: profiles[0],
    layout: './layouts/home'})
});

app.post('/ReportedPosts/Ignore/:postUID', (req, res) => {
  console.log(`Ignoring post: ${req.params["postUID"]}`)
  ignoreReportedPost(db, req.params["postUID"])
  res.send(`Ignoring post: ${req.params["postUID"]}`)
});

app.post('/ReportedPosts/Remove/:postUID', (req, res) => {
  console.log(`Removing post: ${req.params["postUID"]}`)
  removeReportedPost(db, req.params["postUID"])
  res.send(`Removing post: ${req.params["postUID"]}`)
});

app.post('/ReportedComments/Ignore/:commentUID', (req, res) => {
  console.log(`Ignoring commentUID: ${req.params["commentUID"]}`)
  ignoreReportedComment(db, req.params["commentUID"])
  res.send(`Ignoring commentUID: ${req.params["commentUID"]}`)
});

app.post('/ReportedComments/Remove/:postUID/:commentUID', (req, res) => {
  console.log(`Removing commentUID: ${req.params["commentUID"]}`)
  removeReportedComment(db, req.params["commentUID"], req.params["postUID"])
  res.send(`Removing commentUID: ${req.params["commentUID"]} for post ${req.params["postUID"]}`)
});

app.post('/ReportedProfiles/Ignore/:profileUID', (req, res) => {
  console.log(`Ignoring profile: ${req.params["profileUID"]}`)
  ignoreReportedProfile(db, req.params["profileUID"])
  res.send(`Ignoring profile: ${req.params["profileUID"]}`)
});

app.post('/ReportedProfiles/Remove/:profileUID', (req, res) => {
  console.log(`Removing profile: ${req.params["profileUID"]}`)
  removeReportedProfile(db, req.params["profileUID"])
  res.send(`Removing profile: ${req.params["profileUID"]}`)
});

app.post('/test', (req, res) => {
  console.log("Test endpoint hit!");
  return res.send()
})

// app.get('/', (req, res) => {
//   "Hello"
// })
