'use strict';
let faker = require('faker');

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({region: 'us-east-1', apiVersion: '2012-08-10'})

exports.profiles = (event, context, callback) => {
    let path = event.path;
    let params = '';
    switch (path) {
        case "/profiles/create":
            params = {
                Item: {
                    "id": {
                        S: 'user_' + Math.random().toString(36).substr(2, 9)
                    },
                    "Firstname": {S: event.firstname},
                    "Lastname": {S: event.lastname},
                    "Username": {S: event.username},
                    "Phone": {S: event.phone},
                    "Email": {S: event.email},
                    "DOB": {S: event.dob},
                    "HashFirstname": {S: event.firstname.toLowerCase()},
                    "HashLastname": {S: event.lastname.toLowerCase()},
                    "HashUsername": {S: event.username.toLowerCase()},
                    "HashEmail": {S: event.email.toLowerCase()},
                },
                TableName: "utruck-profiles"
            };
            dynamoDB.putItem(params, function (err, data) {
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
                    response = {
                        "statusCode": 400,
                        "body": JSON.stringify(data),
                        "isBase64Encoded": false
                    };

                    callback(null, response);
                }
            });
            break;
        case 'profiles/load-data':

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
