'use strict';

// *****************************************************
// Diff File Directive
// *****************************************************

module.directive('diff', ['$stateParams', '$state', '$HUB', '$RPC', 'Reference', '$filter',
    function($stateParams, $state, $HUB, $RPC, Reference, $filter) {
        return {
            restrict: 'E',
            templateUrl: '/directives/templates/diff.html',
            scope: {
                file: '=',
                pull: '=',
                repo: '=',
                thread: '='
            },
            link: function(scope, elem, attrs) {

                scope.expanded = false;

                scope.open = !scope.file.ignored;

                //
                // Helper funtions
                //

                scope.referenced = function(path, positionBase, positionHead) {

                    var baseRef = Reference.get(path, positionBase);
                    var headRef = Reference.get(path, positionHead);

                    return (scope.thread[$stateParams.base] && scope.thread[$stateParams.base][baseRef]) ||
                           (scope.thread[$stateParams.head] && scope.thread[$stateParams.head][headRef]);
                };

                scope.selected = function(path, positionBase, positionHead) {

                    var baseRef = Reference.get(path, positionBase);
                    var headRef = Reference.get(path, positionHead);

                    return ($stateParams.sha === $stateParams.base && $stateParams.ref === baseRef) ||
                           ($stateParams.sha === $stateParams.head && $stateParams.ref === headRef);
                };

                scope.go = function(path, positionBase, positionHead) {

                    var baseRef = Reference.get(path, positionBase);
                    var headRef = Reference.get(path, positionHead);

                    if(scope.thread[$stateParams.base] && scope.thread[$stateParams.base][baseRef]) {
                        $state.go('repo.pull.review.reviewItem', {
                            sha: $stateParams.base,
                            ref: baseRef
                        });
                    }
                    else if(positionHead) {
                        $state.go('repo.pull.review.reviewItem', {
                            base: scope.pull.base.sha,
                            head: scope.pull.head.sha,
                            sha: scope.pull.head.sha,
                            ref: headRef
                        });
                    }
                };

                //
                // Expand the diff
                //

                scope.$watch('file.patch', function(patch) {
                    if(patch && patch.length && !scope.file.image) {
                        $HUB.wrap('gitdata', 'getBlob', {
                            user: $stateParams.user,
                            repo: $stateParams.repo,
                            sha: scope.file.sha
                        }, function(err, blob) {
                            if(!err) {

                                var file = [], chunks = [];
                                var index = 0;

                                // find the chunks
                                while (index < scope.file.patch.length) {
                                    if(scope.file.patch[index].chunk) {
                                        var start = 0, end = 0, c = [];
                                        while( ++index < scope.file.patch.length && !scope.file.patch[index].chunk ) {
                                            start = start ? start : scope.file.patch[index].head;
                                            end = scope.file.patch[index].head ? scope.file.patch[index].head : end;
                                            c.push(scope.file.patch[index]);
                                        }

                                        chunks.push({ start: start, end: end, chunk: c });
                                        continue;
                                    }
                                    index = index + 1;
                                }

                                index = 0;

                                // insert the chunks
                                while (index < blob.value.content.length) {
                                    if( chunks[0] && blob.value.content[index].head === chunks[0].start ) {
                                        var chunk = chunks.shift();
                                        file = file.concat( chunk.chunk );
                                        index = chunk.end;
                                        continue;
                                    }

                                    file.push( blob.value.content[index] );
                                    index = index + 1;
                                }

                                // set the file
                                scope.file.file = file;
                            }

                        });
                    }

                });
            }
        };
    }
]);
