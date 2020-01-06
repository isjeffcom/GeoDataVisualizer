//var qs = require('qs')
var axios = require('axios')
//var utils = require('./utils.js')

// General get data
export function genGet (api, param, callback) {
    
    axios.get(contParam(api, param)).then((response) => {

        if(typeof(response.data) == "string"){
            callback({status: false, error: response.data})
            return
        } else {
            callback({status: true, data: response.data})
            return
        }

    }).catch((err) => {

        callback({status: false, error: err})

    })
}

/*export function genUpdate (api, data, callback) {


    var postData = qs.stringify(data)

    axios.post(api, postData)
    .then(function (response) {

        if(response.data.indexOf("success") != -1){
            callback({status: true, data: response.data})
        } else {
            callback({status: false, data: response.data})
        }

    }).catch(function(err){

        callback({status: false, data: err})

    })
}*/

// Construct url with paramaters
function contParam (api, param) {
    
    // Assumble get url paramaters
    if(param.length > 0){
        api = api + "?"
        
        
        for(var i=0;i<param.length;i++){

            if(i == param.length - 1){
                
                api = api + param[i].name + "=" + param[i].val
            } else {
                api = api + param[i].name + "=" + param[i].val + "&"
            } 
        }    
    }

    return api
}