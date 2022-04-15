function ignoreReportedPost(postUID) {
    console.log(postUID)
    fetch(`/ReportedPosts/Ignore/${postUID}`,
     {method: 'POST'})
    .then(() =>  document.getElementById(`reportedPostRow_${postUID}`).remove());
}

function removeReportedPost(postUID) {
    console.log(postUID)
    fetch(`/ReportedPosts/Remove/${commentUID}`,
     {method: 'POST'})
    .then(() =>  document.getElementById(`reportedPostRow_${postUID}`).remove());
}

function ignoreReportedComment(commentUID) {
    console.log(commentUID)
    fetch(`/ReportedComments/Ignore/${commentUID}`,
     {method: 'POST'})
    .then(() =>  document.getElementById(`reportedCommentRow_${commentUID}`).remove());
}

function removeReportedComment(commentUID, postUID) {
    console.log(commentUID, postUID)
    fetch(`/ReportedComments/Remove/${postUID}/${commentUID}`,
     {method: 'POST'})
    .then(() =>  document.getElementById(`reportedCommentRow_${commentUID}`).remove());
}

function ignoreReportedProfile(profileUID) {
    console.log(profileUID)
    fetch(`/ReportedProfiles/Ignore/${profileUID}`,
     {method: 'POST'})
    .then(() =>  document.getElementById(`reportedProfileRow_${profileUID}`).remove());
}

function removeReportedProfile(profileUID) {
    console.log(profileUID)
    fetch(`/ReportedProfiles/Remove/${profileUID}`,
     {method: 'POST'})
    .then(() =>  document.getElementById(`reportedProfileRow_${profileUID}`).remove());
}