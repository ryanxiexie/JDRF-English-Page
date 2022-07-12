console.log('test.js is loaded');

var currentScript = document.currentScript;

var f = currentScript.getAttribute('f');
var j = currentScript.getAttribute('j');

var t = new Date().toISOString();
var journeyID = j + t;

console.log('f is ', f);
console.log('j is ', j);

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

function getUrlParam(key) {
  const param = urlParams.get(key);
  return param;
}

// example: GA1.1.2142728155.1653310839 get id which match GA4 report App-instance ID 2142728155.1653310839
// TODO: handle ga not exist
const gaID = getCookie('_ga').substring(6);
console.log('ga ID is ', gaID);

async function sendMarketingInfo(info) {
  fetch('https://ut-server.herokuapp.com/create_marketing_info', {
    method: 'POST',
    body: JSON.stringify(info),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((res) => console.log('marketing info created is ', res))
    .catch((err) => {
      console.log('error is ', err);
    });
}

function setContext(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getContext(key) {
  return JSON.parse(localStorage.getItem(key));
}

function phoneValidator(phone) {
  const regEx = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  if (phone.match(regEx)) {
    return true;
  }
}

// read remktInfo object from local storage when thank you page loaded
var remktInfo =
  getContext(`remktInfo`) == null
    ? { journeyID, gaID }
    : getContext(`remktInfo`);

console.log('remktInfo is ', remktInfo);
jQuery(document).ready(function ($) {
  fetch(`https://ut-server.herokuapp.com/config?formID=${f}`)
    .then((response) => response.json())
    .then((data) => {
      remktInfo.formID = data.formID;
      data.trackingFields.map((field) => {
        $(`#${field.fieldID}`).blur(function () {
          var newField = field.fieldName;

          // handle input checkbox
          if (field.fieldType == 'checkbox') {
            this.checked
              ? (remktInfo[newField] = 'true')
              : (remktInfo[newField] = 'false');
          } else remktInfo[newField] = this.value;
          setContext(`remktInfo`, remktInfo);
          newField == 'phone' && phoneValidator(this.value);
          this.value != '' && sendMarketingInfo(remktInfo);
        });
      });
      data.urlParameters.map((param) => {
        remktInfo[param] = getUrlParam(param);
        setContext(`remktInfo`, remktInfo);
      });
    });

  // save info in localStorage when submit button clicked
  // $('#donate').submit(function (event) {
  //   setContext('remktInfo', remktInfo);
  //   alert('Handler for .submit() called.');
  //   // event.preventDefault();
  // });

  // add transaction info into local storage
  var transactionAmount = $('#transaction').text();
  if ($('#transaction').text() != '') {
    remktInfo.transactionAmount = transactionAmount;
    setContext(`remktInfo`, remktInfo);
    sendMarketingInfo(remktInfo).then(() => {
      remktInfo = {
        journeyID: remktInfo.journeyID,
        formID: remktInfo.formID,
        gaID: remktInfo.gaID,
      };

      setContext(`remktInfo`, remktInfo);
    });
  }
});
