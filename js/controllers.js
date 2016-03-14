'use strict';

/* Controllers */

angular.module('qcmffvl.controllers', [])

.controller('MainCtrl', function($scope, API, $route, $http, $location, $timeout, dialogs) {

    $scope.main = {
        category: {
            options: [ "Parapente" ],
            checked: "Parapente"
        },
        level: {
            options: [ "Brevet Initial", "Brevet de Pilote", "Brevet de Pilote Confirmé"],
            checked: "Brevet de Pilote"
        },
        nbquestions: {
        	options: [ "10", "30", "60", "90", "Toutes les" ],
        	checked: "30"
        },
        // TODO: ajouter "révision" et prepend "examen"
        typeExam: {
            options: [ "Révision", "Examen papier" ],
            // options: [ "Révision", "Examen papier", "Examen numérique"],
            checked: "Examen papier"
        },
        targetExam: {
            options: [ "Candidat", "Examinateur" ],
            checked: "Candidat"
        },
        displayLimit: 10000,
        checkAnswers: false,
        score: {
            total: 0,
            nb: 0,
            percentage: 0,
            user: 0
        },
        examMode: false,
        examPapier: false,
        examNumerique: false,
        examPapierCandidat: false,
        examPapierExaminateur: false,
        QCMID: ""
    }
    $scope.main.search  = {
    	num_niveau: $scope.main.level.options.indexOf($scope.main.level.checked)
    }
    $scope.main.limit = $scope.main.nbquestions.checked;
    $scope.reloadQCM = false;
    $scope.loading = true;

    // store qcm in $parent to allow for offline usage
    if (!$scope.qcm) {
        //console.log("loading JSON");
        $http.get('/json/qcm2014-1.json')
        .success(function(data, status, headers, config){
            $scope.qcm = data;
            $scope.qcmOrig = angular.copy($scope.qcm);
            $scope.generateQCM();
        })
        .error(function() {
            var dlg = dialogs.error('Erreur','Impossible de charger le JSON');
            dlg.result();
        });
    }

    $scope.generateQCM = function(QCMID) {
        // $scope.main.QCMID = API.generateQCM($scope.qcm, (Math.pow(2, 32)-1));
        $scope.main.QCMID = API.generateQCM($scope.qcm, QCMID);
    }

    $scope.reload = function() {
        var dlg = dialogs.confirm('Confirmation','Composer un nouveau questionnaire (ceci effacera vos réponses) ?');
        dlg.result.then(function(btn){
        	$scope.reloadQCM = true;
        },function(btn){
            //cancel
        });
    }

    $scope.scoreClass = function(score) {
        if (score.percentage >= 75) {
            return "good-score";
        } else {
            return "bad-score";
        }
    }
    $scope.resetQCMDisplay = function() {
// TODO: if /exam, keep /exam
		// $location.path('/qcm')
        $scope.collapseNav();
		$scope.loading = true;
		$scope.main.displayLimit = 0;
		$timeout(function() {
			$scope.main.displayLimit = 10000;
		}, 0);
    }

    $scope.collapseNav = function() {
        $('html').trigger('click');
        $scope.navCollapsed = true;
    }

    $scope.fillQCMAnswers = function() {
        $scope.main.checkAnswers = true;
        API.tickAnswers($scope.qcm);
    }

    $scope.unfillQCMAnswers = function() {
        $scope.main.checkAnswers = false;
        API.untickAnswers($scope.qcm);
    }

    $scope.updateExamVariables = function() {
        $scope.main.examMode = ($scope.main.typeExam.checked.indexOf("Examen") != -1);
        if ($scope.main.examMode) {
            $scope.main.examPapier = ($scope.main.typeExam.checked == "Examen papier");
            $scope.main.examNumerique = !$scope.main.examPapier;
            $scope.targetCandidat = ($scope.main.targetExam.checked == "Candidat");
            $scope.main.examPapierCandidat = ($scope.main.examPapier && $scope.targetCandidat);
            $scope.main.examPapierExaminateur = ($scope.main.examPapier && !$scope.targetCandidat);
        } else {
            $scope.main.examPapierExaminateur = $scope.main.examPapierCandidat = $scope.main.examPapier = $scope.main.examNumerique =  false;
        }
        if ($scope.qcm) {
            if ($scope.main.examPapierExaminateur) {
                $scope.fillQCMAnswers();
            } else {
                $scope.unfillQCMAnswers();
            }
        }
    }

    $scope.browserChrome = function() {
        return (navigator.appVersion.indexOf("Chrome") != -1);
    }

    $scope.$watch("reloadQCM", function(newval, oldval) {
    	if (newval) {
    		$timeout(function() {
    			$scope.reloadQCM = false;
    			$scope.resetQCMDisplay();
                $scope.qcm = angular.copy($scope.qcmOrig)
		    	$scope.generateQCM();
                // TODO: check if OK to disable
		        // $location.path("qcm");
		        $route.reload();
    		},500);
	    }
    })

    $scope.$watch('main.nbquestions.checked', function(newval, oldval) {
        if (newval != oldval) {
        	$timeout(function() {
        		$scope.resetQCMDisplay();
        		var limit = $scope.main.nbquestions.checked;
        		if (limit === "Toutes les") {
        			limit = 10000;
        		}
        		$scope.main.limit = limit;
        	},100);
        }
    })

    $scope.$watch('main.level.checked', function(newval, oldval) {
        if (newval != oldval) {
        	$timeout(function() {
        		$scope.resetQCMDisplay();
        		$scope.main.search.num_niveau = $scope.main.level.options.indexOf($scope.main.level.checked);
        	},100);
        }
    });

    $scope.$watch('main.typeExam.checked', function(newval, oldval) {
        if (newval != oldval) {
            $timeout(function() {
                $scope.collapseNav();
            },100);
        }
        $scope.updateExamVariables();
    });

    $scope.$watch('main.targetExam.checked', function(newval, oldval) {
        if (newval != oldval) {
            $timeout(function() {
                $scope.collapseNav();
            },100);
        }
        $scope.updateExamVariables();
    });

    $scope.$watch('main.examMode', function(newval, oldval) {
        if (newval != oldval) {
            $scope.updateExamVariables();
        }
    });

 })

.controller('QCMCtrl', function($scope, $filter, $timeout, API, filterFilter) {
    $scope.main.checkAnswers = false;
    $scope.main.examMode = false;
    $scope.questions = [];
    $scope.$parent.resetQCMDisplay();

    $scope.toggleCheck = function(answer) {
        if ($scope.$parent.navCollapsed && !$scope.main.checkAnswers) {
            answer.checked = !answer.checked;
        }
    }

	$scope.collapseNav = function() {
		$scope.$parent.navCollapsed = true;
	}

    $scope.getPoints = function(question) {
        var total = 0;
        for (var i = 0; i < question.ans.length; i++) {
            if (question.ans[i].checked) {
                total += parseInt(question.ans[i].pts);
            }
        }
        if (total < 0) {
            total = 0;
        }
        return total;
    }

    $scope.getScore = function() {
        var arr = filterFilter($scope.qcm, $scope.main.search);
        arr = $filter('limitTo')(arr, $scope.main.limit)
        var score = { user: 0, nb: 0, percentage: 0 };
        for(var i = 0; i < arr.length; i++){
            var question = arr[i];
            score.user += $scope.getPoints(question);
        }
        score.nb = i;
        score.total = i*6;
        if (score.total > 0) {
            score.percentage = Math.round(score.user / score.total * 100);
        }
        return score;
    }

    // $scope.addMoreQuestions = function() {
    //     var limit = $scope.limit;
    //     var arr = filterFilter($scope.qcm, $scope.search);
    //     arr = $filter('limitTo')(arr, limit);

    //     var size = $scope.questions.length;
    //     var loadable = limit - size;
    //     if(loadable > 5) { loadable = 5 }
    //     for (var i=size; i<size+loadable; i++) {
    //         $scope.questions.push(arr[i]);
    //     }
    // }
    $scope.successQuestion = function(question) {
        return ($scope.main.checkAnswers && $scope.getPoints(question) === 6 && !$scope.main.examPapier);
    }

    $scope.failedQuestion = function(question) {
        return ($scope.main.checkAnswers && !$scope.successQuestion(question) && !$scope.main.examPapier);
    }

    $scope.goodAnswer = function(answer) {
        return ($scope.main.checkAnswers && answer.pts > 0 && !$scope.main.examPapier);
    }

    $scope.badAnswer = function(answer) {
        return ($scope.main.checkAnswers && answer.pts < 0 && !$scope.main.examPapier);
    }

    $scope.updateScore = function() {
        if ($scope.main.checkAnswers) {
            $scope.main.score = $scope.getScore();
        }
    }

    $scope.$watch('main.checkAnswers', function() {
        $scope.updateScore();
    })

})

.controller('SelfTestCtrl', function($scope, API) {
    $scope.$parent.loading = false;
	$scope.selftest = [];
	$scope.selftest.numitems   = 600;
	$scope.selftest.numruns    = 10000;
	$scope.selftest.showperrun = 60;

	$scope.selftest.qcm = [];
	for(var i = 1; i <= $scope.selftest.numitems; i++) {
		var obj = { question : i , ans : "x", shown : 0 };
		$scope.selftest.qcm.push(obj);
	}
//	console.log($scope.selftest.qcm);
	for(var i = 1; i <= $scope.selftest.numruns; i++){
//		console.log("run " + i );
		API.generateQCM($scope.selftest.qcm);
//		console.log($scope.selftest.qcm);
		for(var j = 0; j < $scope.main.nbquestions.checked ; j++){
			$scope.selftest.qcm[j].shown++;
		}
	}
	for(var i = 0; i < $scope.selftest.numitems; i++) {
		$scope.selftest.qcm[i].percent = (($scope.selftest.qcm[i].shown / $scope.selftest.numruns) * 100).toFixed(2);;
	}

})

.controller('ExamCtrl', function($scope) {
    $scope.$parent.main.examMode = true;
    $scope.$parent.main.checkAnswers = false;
    $scope.$parent.updateExamVariables();
})

.controller('AboutCtrl', function($scope) {
    $scope.$parent.navCollapsed = true;
    $scope.$parent.loading = false;

    document.body.scrollTop = document.documentElement.scrollTop = 0;
});
