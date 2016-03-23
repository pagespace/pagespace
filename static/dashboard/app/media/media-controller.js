
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('MediaController', function($scope, $rootScope, $location, mediaService) {
    $rootScope.pageTitle = 'Media';

    $scope.isImage = mediaService.isImage;
    $scope.getMimeClass = mediaService.getMimeClass;
    $scope.getSrcPath = mediaService.getSrcPath;
    $scope.mediaItems = [];
    $scope.availableTags = [];
    $scope.selectedTags = [];

    $scope.showItem = function(item) {
        $location.path('/media/' + item._id);
    };

    $scope.toggleTag = function(tag) {
        if(tag.on) {
            deselectTag(tag);
        } else {
            selectTag(tag);
        }
    };

    function selectTag(newTag) {
        newTag.on = true;
        var alreadyExists = $scope.selectedTags.some(function(tag) {
            return newTag.text === tag.text;
        });
        if(!alreadyExists) {
            $scope.selectedTags.push(newTag);
        }
        updateFilter();
    }

    function deselectTag(oldTag) {
        oldTag.on = false;
        $scope.selectedTags = $scope.selectedTags.filter(function(tag) {
            return oldTag.text !== tag.text;
        });
        updateFilter();
    }

    function updateFilter() {

        if($scope.selectedTags.length === 0) {
            $scope.filteredItems = $scope.mediaItems;
            return;
        }

        $scope.filteredItems = $scope.mediaItems.filter(function(item) {
            return item.tags.some(function(tag) {
                return $scope.selectedTags.some(function(selectedTag) {
                    return selectedTag.text === tag.text;
                });
            });
        });
    }

    mediaService.getItems().success(function(items) {
        $scope.mediaItems = items;
        updateFilter();

        //combine all tags into one
        var availableTags = items.reduce(function(allTags, item) {
            return allTags.concat(item.tags.filter(function(tag) {
                return tag.text; //only return tags with text property
            }));
        }, []);

        //remove dups
        var seen = {};
        availableTags = availableTags.filter(function(tag) {
            return seen.hasOwnProperty(tag.text) ? false : (seen[tag.text] = true);
        });
        $scope.availableTags = availableTags;
    }).error(function(err) {
        $scope.showError('Error getting media items', err);
    });
});

})();