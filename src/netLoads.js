'use strict';

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({region: 'us-east-1', apiVersion: '2012-08-10'})

exports.netLoads = (event, context, callback) => {
    var path = event.path;
    if (event.method && event.method === "POST") {
        path = "/profiles/create";
    }
    let params = '';
    let response;

    switch (path) {
        case "/profiles/create":
            var body = JSON.parse(event.body);
            console.log("Params:", body);

            var _firstName = body.firstname ? body.firstname : "",
                _lastName = body.lastname ? body.lastname : "",
                _dob = body.dob ? body.dob : "",
                _email = body.email ? body.email : "",
                _username = body.username ? body.username : "",
                _phone = body.phone ? body.phone : "";

            if (_firstName.length < 1 || _lastName.length < 1 || _dob.length < 1 ||
                _email.length < 1 || _username.length < 1 || _phone.length < 1) {
                response = {
                    "statusCode": 400,
                    "body": JSON.stringify({"message": "Please fill in all fields", "success": false}),
                    "isBase64Encoded": false
                };
                callback(null, response);
                return;
            }

            var getParams = {
                TableName: 'utruck-profiles',
                FilterExpression: "#email = :email and #username = :username",
                ExpressionAttributeNames: {
                    '#email': 'HashEmail',
                    '#username': 'HashUsername'
                },
                ExpressionAttributeValues: {
                    ":email": {
                        S: _email.toLowerCase(),
                    },
                    ":username": {
                        S: _username.toLowerCase(),
                    },
                }
            };
            dynamoDB.scan(getParams, function (err, data) {
                if (err) {
                    console.log(err);
                    response = {
                        "statusCode": 400,
                        "body": JSON.stringify(err),
                        "isBase64Encoded": false
                    };
                    callback(null, response);
                }
                else {
                    console.log(data); // successful response
                    if (data.Count > 0) {
                        response = {
                            "statusCode": 400,
                            "body": JSON.stringify({
                                "message": "User exists",
                                "success": false
                            }),
                            "isBase64Encoded": false
                        };
                        callback(null, response);
                    } else {
                        params = {
                            Item: {
                                "id": {
                                    S: "user_" + Math.random().toString(36).substr(2, 9)
                                },
                                "Firstname": {S: _firstName},
                                "Lastname": {S: _lastName},
                                "Username": {S: _username},
                                "Phone": {S: _phone},
                                "Email": {S: _email},
                                "DOB": {S: _dob},
                                "HashFirstname": {S: _firstName.toLowerCase()},
                                "HashLastname": {S: _lastName.toLowerCase()},
                                "HashUsername": {S: _username.toLowerCase()},
                                "HashEmail": {S: _email.toLowerCase()},
                            },
                            TableName: "utruck-profiles"
                        };
                        dynamoDB.putItem(params, function (err, data) {

                            if (err) {
                                console.log(err);
                                response = {
                                    "statusCode": 400,
                                    "body": JSON.stringify(err),
                                    "isBase64Encoded": false
                                };
                                callback(null, response);
                            }
                            else {
                                var getParams = {
                                    TableName: 'utruck-profiles',
                                    FilterExpression: "#email = :email and #username = :username",
                                    ExpressionAttributeNames: {
                                        '#email': 'HashEmail',
                                        '#username': 'HashUsername'
                                    },
                                    ExpressionAttributeValues: {
                                        ":email": {
                                            S: _email.toLowerCase(),
                                        },
                                        ":username": {
                                            S: _username.toLowerCase(),
                                        },
                                    }
                                };
                                dynamoDB.scan(getParams, function (err, data) {
                                    if (err) {
                                        console.log(err);
                                        response = {
                                            "statusCode": 400,
                                            "body": JSON.stringify(err),
                                            "isBase64Encoded": false
                                        };
                                        callback(null, response);
                                    }
                                    else {
                                        console.log(data); // successful response
                                        response = {
                                            "statusCode": 200,
                                            "body": JSON.stringify(data),
                                            "isBase64Encoded": false
                                        };
                                        callback(null, response);
                                    }
                                });
                            }
                        });
                    }
                }
            });
            break;
        default:
            if (event.queryStringParameters && "search" in event.queryStringParameters) {
                let queryString = event.queryStringParameters.search;
                params = {
                    TableName: 'utruck-profiles',
                    FilterExpression: "#pk = :qs or #fn = :qs or #ln = :qs or #email = :qs or #username = :qs",
                    ExpressionAttributeNames: {
                        '#pk': 'id',
                        '#fn': 'HashFirstname',
                        '#ln': 'HashLastname',
                        '#email': 'HashEmail',
                        '#username': 'HashUsername'
                    },
                    ExpressionAttributeValues: {
                        ":qs": {
                            S: queryString.toLowerCase()
                        }
                    }
                };
            } else {
                params = {
                    TableName: 'utruck-profiles',
                };
            }
            dynamoDB.scan(params, function (err, data) {
                let response;
                if (err) {
                    response = {
                        "statusCode": 400,
                        "body": JSON.stringify(err),
                        "isBase64Encoded": false
                    };

                    callback(null, response);
                }
                else {
                    const items = data.Items.map(
                        (datefield) => {
                            return {
                                "id": datefield.id.S,
                                "DOB": datefield.DOB.S,
                                "Firstname": datefield.Firstname.S,
                                "Lastname": datefield.Lastname.S,
                                "Phone": datefield.Phone.S,
                                "Username": datefield.Username.S
                            }
                        });
                    response = {
                        "statusCode": 200,
                        "body": JSON.stringify(items),
                        "isBase64Encoded": false
                    };
                    callback(null, response);
                }
            });
            break;
    }
};
