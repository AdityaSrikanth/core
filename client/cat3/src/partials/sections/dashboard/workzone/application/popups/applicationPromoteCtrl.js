/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2016
 */

(function(){
    "use strict";
    angular.module('workzone.application').controller('applicationPromoteCtrl', ['items','$scope','$rootScope','$modal', '$modalInstance','workzoneServices','workzoneEnvironment', function(items,$scope,$rootScope,$modal, $modalInstance,workSvs,workEnvt) {
        angular.extend($scope,{currentCardDetails:items}, {
            cancel: function() {
                $modalInstance.dismiss('cancel');
            }
        });
        
        var promApp={
            newEnt:[],
            envOptions:[],
            jobOptions:[]
        };
        promApp.init =function(){
            promApp.newEnt.currentEnv=$scope.currentCardDetails.envName;
            var config=$scope.currentCardDetails.config;
            var currentEncInd=config.envSequence.indexOf($scope.currentCardDetails.envName);
           angular.forEach(config.envSequence,function (val) {
               if(config.envId.indexOf(val) !== -1 && config.envSequence.indexOf(val) > currentEncInd) {
                   promApp.envOptions.push(val);
               }
           });
            promApp.getAllChefJobs();
        };
        promApp.getAllChefJobs =function () {
            workSvs.getChefJob().then(function (jobResult) {
                promApp.jobOptions = jobResult.data;
            });
        };
        promApp.createNewJob = function (){
            $rootScope.$emit("CREATE_NEW_JOB");
            $rootScope.createChefJob=true;
        };
        promApp.submitAppPromote = function(){
            promApp.submitData= {
                "appData": {
                    "version": promApp.newEnt.version,
                    "sourceEnv": promApp.newEnt.currentEnv,
                    "targetEnv":promApp.newEnt.targetEnv,
                    "appName":$scope.currentCardDetails.appName.name, // for nexus(nexus.artifactId) and for docker(docker.image)
                    "projectId":workEnvt.getEnvParams().proj,
                },
                "task": {
                    "taskId": promApp.jobOptions[promApp.newEnt.jobInd]._id,
                    "nodeIds": promApp.jobOptions[promApp.newEnt.jobInd].taskConfig.nodeIds
                }
            };
            workSvs.putAppPromote(promApp.submitData).then(function(){
                
            });
        };
        // call job api after creating new job .
        $rootScope.$on("GET_ALL_TASK", function(){
            promApp.getAllChefJobs();
            $rootScope.createChefJob=false;
        });
        return promApp;
    }]);
})();