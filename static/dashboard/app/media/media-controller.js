
(function() {

/**
 *
 * @type {*}
 */
var adminApp = angular.module('adminApp');
adminApp.controller('MediaController', function($scope, $rootScope, $location, $window, $q, mediaService) {
    $rootScope.pageTitle = 'Media';

    $scope.files = [];

    $scope.mediaItems = [];
    $scope.filteredItems = [];
    $scope.availableTags = [];
    $scope.selectedTags = [];

    $scope.getTypeShortName = mediaService.getTypeShortName;
    $scope.getSrcPath = mediaService.getSrcPath;
    
    $scope.clearFiles = function() {
        $scope.files = [];
    };

    $scope.toggleEditing = function (item) {
        item._editing = !item._editing
    };

    $scope.setItems = function (items) {
        $scope.mediaItems = items;
    };
    
    $scope.getItems = function() {
        mediaService.getItems().then(function(items) {
            $scope.setItems(items);
            $scope.updateFilter();

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
        }).catch(function(err) {
            $scope.showError('Error getting media items', err);
        });
    };

    $scope.getMatchingTags = function(text) {
        text = text.toLowerCase();
        return $q(function(resolve) {
            resolve($scope.availableTags.filter(function(tag) {
                return tag.text && tag.text.toLowerCase().indexOf(text) > -1;
            }));
        });
    };

    $scope.toggleTag = function(tag) {
        if(tag.on) {
            deselectTag(tag);
        } else {
            selectTag(tag);
        }
    };
    
    $scope.addTag = function(newTag) {
        var exists = $scope.availableTags.some(function(availableTag) {
            return availableTag.text === newTag.text;
        });
        if(!exists) {
            $scope.availableTags.push(newTag);
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
        $scope.updateFilter();
    }

    function deselectTag(oldTag) {
        oldTag.on = false;
        $scope.selectedTags = $scope.selectedTags.filter(function(tag) {
            return oldTag.text !== tag.text;
        });
        $scope.updateFilter();
    }

    $scope.updateFilter = function() {

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
    
   
});

})();