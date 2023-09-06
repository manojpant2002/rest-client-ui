import { rest } from 'msw'
import testData, { endPoints, responseHeaders } from '../testdata'

export const handlers = [
    rest.get(endPoints.getUsers, (req, res, ctx) => {
        const response: ResponseI = {
            requestHeaders: {},
            data: testData.userList,
            queries: null,
            pathParams: null,
            message: "User List fetched successfully"
        }

        return res(
            ctx.set(responseHeaders),
            ctx.status(200),
            ctx.json(response)
        )
    }),

    rest.post(endPoints.postLogin, (req, res, ctx) => {
        const response: ResponseI = {
            requestHeaders: req.headers.all(),
            data: null,
            queries: null,
            pathParams: null,
            message: "Login Successful"
        }

        return res(
            ctx.status(200),
            ctx.json(response)
        )
    }),

    rest.post(endPoints.postCreateAccount, async (req, res, ctx) => {
        const requestObject = await req.json().then(data => data)
        const response: ResponseI = {
            requestHeaders: {},
            data: requestObject,
            queries: null,
            pathParams: null,
            message: "User account created successfully"
        }

        return res(
            ctx.status(200),
            ctx.json(response)
        )
    }),

    rest.get(endPoints.getVerifyHeader, (req, res, ctx) => {
        const response: ResponseI = {
            requestHeaders: req.headers.all(),
            data: null,
            queries: null,
            pathParams: null,
            message: "Received the headers successfully"
        }

        return res(
            ctx.status(200),
            ctx.json(response)
        )
    }),

    rest.put(`${endPoints.putResource}/:userId`, (req, res, ctx) => {
        const response: ResponseI = {
            requestHeaders: {},
            data: null,
            queries: null,
            pathParams: req.params,
            message: "User details updated successfully"
        }

        return res(
            ctx.status(204),
            ctx.json(response)
        )
    }),

    rest.put(`${endPoints.putResource}/:userId/:event`, (req, res, ctx) => {
        const response: ResponseI = {
            requestHeaders: {},
            data: null,
            queries: null,
            pathParams: req.params,
            message: "User details updated successfully"
        }

        return res(
            ctx.status(204),
            ctx.json(response)
        )
    }),

    rest.get(endPoints.getQueryParams, (req, res, ctx) => {
        let queries: any = {};
        for (const [key, value] of req.url.searchParams) {
            queries[key] = value;
        }

        const response: ResponseI = {
            requestHeaders: {},
            data: null,
            queries,
            pathParams: null,
            message: "Received the query parameters successfully"
        }

        return res(
            ctx.status(200),
            ctx.json(response)
        )
    }),

    rest.delete(`${endPoints.deleteResource}/:userId`, (req, res, ctx) => {
        const response: ResponseI = {
            requestHeaders: {},
            data: null,
            queries: null,
            pathParams: req.params,
            message: "User deleted successfully"
        }

        return res(
            ctx.status(200),
            ctx.json(response)
        )
    }),

    rest.post(endPoints.proxyServer, async (req, res, ctx) => {
        const requestObject = await req.json().then(data => data)
        console.log(requestObject)
        const error = requestObject.endpointAddress === "http://wavemaker.com/proxyerror"
        const proxyResponse: ProxyResponseI = {
            headers: req.headers.all(),
            responseBody: JSON.stringify(requestObject),
            statusCode: "200"
        }

        return res(
            ctx.status(error ? 400 : 200),
            ctx.json(error ? "Cannot process the request due to a client error" : proxyResponse)
        )
    }),

    rest.get(endPoints.badRequest, (req, res, ctx) => {
        return res(
            ctx.status(400),
            ctx.json("Cannot process the request due to a client error")
        )
    }),

    rest.post(endPoints.postMultipartData, async (req, res, ctx) => {
        const response: ResponseI = {
            requestHeaders: req.headers.all(),
            data: null,
            queries: null,
            pathParams: null,
            message: "Multipart/form data received successfully"
        }
        return res(
            ctx.status(200),
            ctx.json(response)
        )
    })
]


export interface ResponseI {
    requestHeaders: Record<string, string>,
    message: string,
    data: any,
    pathParams: any,
    queries: any,
}

export interface ProxyResponseI {
    responseBody: any,
    statusCode: any,
    headers: any
}