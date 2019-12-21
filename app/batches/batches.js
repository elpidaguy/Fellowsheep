
var app = angular.module('riddler', []);

app.controller('riddlerController', function($scope, $http, $timeout, $window) {
	$scope.inputsList = [];

$scope.addBatch = function()
{

     var datatosend =JSON.stringify({"city":$scope.cityname,"branchName":$scope.branchName,"course":$scope.course,"standard":$scope.standard,"time":$scope.timing,"batchName":$scope.inputsList});

    $http.post("http://210.212.181.86:5128/addBatch",datatosend)
    .success(function(data){
        toastr.success(data.message);
        $scope.getBatches();
    })
    .error(function(err){
toastr.error("Something went wrong! Please try again...");


    }) 
};

$scope.getBatches = function()
{
    $http.post("http://210.212.181.86:5128/getBatches")
    .success(function(data){
       // toastr.success(data.message);
       if(data.success == "true")
       {
       $scope.batches = data.batches;
       console.log(data.batches);
   		}
    })  
    .error(function(err){
    toastr.error("Something went wrong! Please try again...");
    }) 



};
$scope.appendBatchInput = function() {
  $scope.inputsList.push({});
};

$scope.removeBatchInput = function(index) {
   $scope.inputsList.splice(index, 1);
};
});