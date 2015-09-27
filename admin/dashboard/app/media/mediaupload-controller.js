(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('MediaUploadController', function($scope, $rootScope, $q, $location, $http, $window, mediaService) {
    $rootScope.pageTitle = 'Upload new media';

    $scope.media = {};

    var availableTags = [];
    mediaService.getItems().success(function(items) {
        var seen = {};
        availableTags = items.reduce(function(allTags, item) {
            return allTags.concat(item.tags.filter(function(tag) {
                return tag.text;
            }));
        }, []).filter(function(tag) {
            return seen.hasOwnProperty(tag) ? false : (seen[tag] = true);
        });
    });

    $scope.getMatchingTags = function(text) {
        text = text.toLowerCase();
        var promise = $q(function(resolve) {
            availableTags.filter(function(tag) {
                return tag.text && tag.text.toLowerCase().indexOf(text) > -1;
            });
            resolve(availableTags);
        });
        return promise;
    };

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

    $scope.upload = function(form) {

        if(form.$invalid || !$scope.media.file) {
            $window.scrollTo(0,0);
            $scope.submitted = true;
            return;
        }

        mediaService.uploadItem($scope.media.file, {
           name: $scope.media.name,
           description: $scope.media.description,
           tags: JSON.stringify($scope.media.tags)
        }).success(function() {
            $location.path('/media');
            $scope.showSuccess('Upload successful');
        }).error(function(err) {
            $scope.showError('Error uploading file', err);
        });
        $scope.showInfo('Upload in progress...');
    };

    $scope.cancel = function() {
        $location.path('/media');
    };
});

})();