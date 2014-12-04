
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('mediaController', function($scope, $rootScope, $http) {
    $rootScope.pageTitle = 'Media';

    $scope.media = {};

    $scope.setFiles = function(files) {
        $scope.media.file = files[0];
        $scope.fileName = files[0].name;
        if(files[0] && files[0].type.match(/image\/[jpeg|png|gif]/)) {
            var reader = new FileReader();
            reader.readAsDataURL(files[0]);

            reader.onload = function (e) {
                $scope.fileSrc = e.target.result;
                $scope.$apply();
            };
        } else {
            $scope.fileSrc = null;
            $scope.$apply();
        }
    };

    $scope.upload = function() {

        var formData = new FormData();
        formData.append("file", $scope.media.file);
        formData.append("name", $scope.media.name);
        formData.append("description", $scope.media.description);
        formData.append("tags", $scope.media.tags);

        //store upload in session, then accept media data
        $http.post('/_media', formData, {
            withCredentials: true,
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity
        }).success(function(uploadData) {

        }).error(function(err) {

        });
    };
});

})();