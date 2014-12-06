
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('mediaUploadController', function($scope, $rootScope, $http, mediaService) {
    $rootScope.pageTitle = 'Upload new media';

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

        mediaService.uploadItem($scope.media.file, {
           name: $scope.media.name,
           description: $scope.media.description,
           tags: $scope.media.tags
        }).success(function() {
            $rootScope.showSuccess('Upload successful');
            $location.path('/media');
        }).error(function(err) {
            $rootScope.showError('Error uploading file', err);
        });
        $rootScope.showInfo('Upload in progress...');
    };
});

})();