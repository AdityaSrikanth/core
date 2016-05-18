/*
 Copyright [2016] [Relevance Lab]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var logger = require('_pr/logger')(module);
var MasterUtil = require('_pr/lib/utils/masterUtil.js');
// @TODO to be replaced on deprecation
var d4dMastersNewModel = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var jwt = require('jsonwebtoken');
var authUtil = require('_pr/lib/utils/authUtil.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var config = require('_pr/config');
var JWTToken = require('_pr/model/v2.0/jwt_token')

var userService = module.exports = {};

//@TODO to be modified to work with tokens as well
userService.getUserOrgs = function getUserOrgs(user, callback) {
    // @TODO Constant to be moved to config
    if (user.roleId == 'Admin') {
        MasterUtil.getAllActiveOrg(function(err, orgs) {
            if (err) {
                var err = new Error('Internal Server Error');
                err.status = 500;
                callback(err);
            } else {
                var orgsResult = orgs.reduce(function(a, b) {
                    a[b.orgname] = b;
                    return a;
                }, {});
                callback(null, orgsResult);
            }
        });
    } else {
        MasterUtil.getOrgs(user.cn, function(err, orgs) {
            if (err) {
                var err = new Error('Internal Server Error');
                err.status = 500;
                callback(err);
            } else {
                var orgsResult = orgs.reduce(function(a, b) {
                    a[b.orgname] = b;
                    return a;
                }, {});
                callback(null, orgsResult);
            }
        });
    }
}

userService.signOut = function signOut(base64Token, callback) {
    if (base64Token) {
        var token = new Buffer(base64Token, 'base64').toString('ascii');
        JWTToken.removeToken(token, function(err, count) {
            if (err) {
                err.status = 500;
                return callback(err);
            }

            callback(null, {
                message: 'token removed'
            });
            return;
        });
    } else {
        var err = new Error('token not available in request');
        err.status = 400;
        callback(err);
    }
};

userService.getUser = function getUser(username, callback) {
    d4dModelNew.d4dModelMastersUsers.find({
        loginname: username,
        id: 7
    }, function(err, usersData) {
        if (err) {
            err.status = 500;
            return callback(err);
        }
        if (usersData && usersData.length) {
            user = usersData[0];
            callback(null, user);
        } else {
            var err = new Error("User does not exist");
            err.status = 400;
        }

    });

};

userService.checkPassword = function checkPassword(user, password, callback) {
    authUtil.checkPassword(password, user.password, function(err, isMatched) {
        if (err) {
            err.status = 500;
            return allback(err)
        }
        if (isMatched) {
            callback(null, user, true);
        } else {
            var err = new Error("password does not match");
            err.status = 400;
            callback(err);
        }
    });
};

userService.generateToken = function generateToken(user, callback) {
    jwt.sign({
        username: user.loginname,
        orgIds: user.orgname_rowid
    }, config.jwt.secret, {
        expiresIn: config.jwt.expiresInSec
    }, function(err, token) {
        if (err) {
            err.status = 500;
            logger.error(err);
            return callback(err);
        }
        // saving token in db 
        JWTToken.createNew({
            token: token,
            expiry: config.jwt.expiresInSec
        }, function(err, jwtToken) {
            if (err) {
                err.status = 500;
                return callback(err);
            }

            var base64Token = new Buffer(token).toString('base64');
            callback(null, {
                token: base64Token
            });
        });
    });
};