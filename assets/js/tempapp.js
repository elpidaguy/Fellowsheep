/**
 * Created by Exabytes on 27-07-2017.
 */
var app = angular.module('fees', []);

app.controller('feesController', function ($scope, $http) {

    $scope.feesCalculate = function () {

        $http.post("http://localhost:4567/icseFeeStructure")
                .success(function (data) {
                    if (data.success == "true") {
                        console.log(data);
                        $scope.data=data;
/*                    toastr.error("trjhvfgkbjuygbjtv";
*/

                    } else {
                    }
                }).error(function(err){
                    toastr.error("Something Went Wrong!");
                });
    
    };
});