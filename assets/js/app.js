
var app = angular.module('riddler', ['720kb.datepicker']);
app.filter('titlecase', function() {
 return function(input) {
  var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

  input = input.toLowerCase();
  return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title) {
   if (index > 0 && index + match.length !== title.length &&
    match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
    (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
    title.charAt(index - 1).search(/[^\s-]/) < 0) {
    return match.toLowerCase();
   }

   if (match.substr(1).search(/[A-Z]|\../) > -1) {
    return match;
   }

   return match.charAt(0).toUpperCase() + match.substr(1);
  });
 }
});


app.controller('riddlerController', function($scope, $http, $timeout, $window, $filter) {
    
$scope.managecities = false;
$scope.managecityadmins = false;
$scope.managebranches = false;
$scope.managebranchadmins = false;

$scope.showeditcityadmins =function()
{
$scope.managecityadmins = true;

$scope.managecities = false;
$scope.managebranches = false;
$scope.managebranchadmins = false;
$scope.getCities();
};

$scope.showeditbranches =function()
{
$scope.managebranches = true;

$scope.managecities = false;
$scope.managecityadmins = false;
$scope.managebranchadmins = false;
$scope.getCities();
$scope.getbranches();
};



$scope.showeditcities = function()
{
$scope.managecities= true;
$scope.managecityadmins = false;
$scope.managebranches = false;
$scope.managebranchadmins = false;

};



$scope.showeditbranchadmins = function()
{
$scope.managecities= false;
$scope.managecityadmins = false;
$scope.managebranches = false;
$scope.managebranchadmins = true;

};





$scope.getbranches = function()
{

  $http.post("http://210.212.181.86:5128/getallbranches")
    .success(function(data){
       // toastr.success(data.message);
       if(data.success == "true")
       {
        console.log(data.branches);

       $scope.branches = data.branches;
   }
    })  
    .error(function(err){
    toastr.error("Something went wrong! Please try again...");
    }) 

  

};
//;

$scope.getCityAdmins = function()
{
    $http.post("http://210.212.181.86:5128/getcityadmin")
    .success(function(data){
       // toastr.success(data.message);
       if(data.success == "true")
       {

       $scope.cityadmins = data.admins;
   }
    })  
    .error(function(err){
    toastr.error("Something went wrong! Please try again...");
    }) 


};


$scope.addCityAdmin = function()
{

     var datatosend =JSON.stringify({"email":$scope.cityadminemail, 
        "mobile":$scope.cityadminmobile, 
        "cityid":$scope.cityid,
        "username":$scope.cityadminusername
    });

    $http.post("http://210.212.181.86:5128/ad",datatosend)
    .success(function(data){
        toastr.success(data.message);
        $scope.getCities();


    })  
    .error(function(err){
toastr.error("Something went wrong! Please try again...");


    }) 



};



$scope.addBranch = function()
{

     var datatosend =JSON.stringify({"branchname":$scope.branchname, 
        "address":$scope.branchaddress, 
        "contact":$scope.branchcontact,
        "cityid":$scope.cityid
    });

    $http.post("http://210.212.181.86:5128/addbranch",datatosend)
    .success(function(data){
        toastr.success(data.message);
        $scope.getbranches();


    })  
    .error(function(err){
toastr.error("Something went wrong! Please try again...");


    }) 



};

$scope.getCities = function()
{
    $http.post("http://210.212.181.86:5128/getcities")
    .success(function(data){
       // toastr.success(data.message);
       if(data.success == "true")
       {

       $scope.cities = data.cities;
   }
    })  
    .error(function(err){
    toastr.error("Something went wrong! Please try again...");
    }) 



};

$scope.addCity = function() {
    
    var datatosend =JSON.stringify({"cityname":$scope.cityname, "district":$scope.district, "state":$scope.state});

    $http.post("http://210.212.181.86:5128/addcity",datatosend)
    .success(function(data){
        toastr.success(data.message);
        $scope.getCities();
    })  
    .error(function(err){
toastr.error("Something went wrong! Please try again...");
    }) 
};


});

app.controller('feesController', function ($scope, $http, $window) {

    $scope.getAllFees = function () {
        var param=JSON.stringify({"board":"state board"})
        waitingDialog.show('...Please Wait');
        $http.post("http://210.212.181.86:5128/getfeestructure",param)
                .success(function (data) {
                    if (data.success == "true") {
                        console.log(data);
                        $scope.result=data;
                        
                        waitingDialog.hide();


                    } else {
                        toastr.error(data.reason);
                        waitingDialog.hide();

                    }
                }).error(function(err){
                    toastr.error("Something Went Wrong!");
                });
    
    };


    $scope.savedata={};
    $scope.saveData = function (id) {
        savedata1=$scope.savedata;
        savedata1["_id"]=id;

        $scope.savedata[id]['_id'] = id
        console.log($scope.savedata[id]);
        if($scope.savedata[id] != undefined)

        {
    var param=JSON.stringify($scope.savedata[id]);
    console.log(param);

        waitingDialog.show('Updating...Please Wait');
        $http.post("http://210.212.181.86:5128/updatefeeinfo",param)
                .success(function (data) {
                    if (data.success == "true") {
                        console.log(data);
                        //$scope.result=data;
                        waitingDialog.hide();
                        window.location.reload();
                    } else {
                         toastr.error(data.reason);
                        waitingDialog.hide();

                    }
                }).error(function(err){
                    toastr.error("Something Went Wrong!");
                    waitingDialog.hide();

                });
            }
    
    };
  });