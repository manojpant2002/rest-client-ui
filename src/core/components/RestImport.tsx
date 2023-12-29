import React, { ChangeEvent, ReactNode, SyntheticEvent, useEffect, useRef, useState } from 'react'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import {
    Box, FormControl, FormLabel, Grid, IconButton, MenuItem, Paper, Select, SelectChangeEvent, Stack, Switch, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography, Button, TextareaAutosize, Alert, createTheme, ThemeProvider
} from '@mui/material'
import ProviderModal from './ProviderModal'
import { BodyParamsI, HeaderAndQueryTable, MultipartTable, HeaderAndQueryI, TableRowStyled, tableHeaderStyle, tableRowStyle } from './Table'
import {
    retrievePathParamNamesFromURL, httpStatusCodes, isValidUrl, removeDuplicatesByComparison, constructUpdatedQueryString,
    findDuplicatesByComparison, retrieveQueryDetailsFromURL, constructCommaSeparatedUniqueQueryValuesString
} from './common/common'
import InfoIcon from '@mui/icons-material/Info'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import Apicall from './common/apicall'
import { encode } from 'js-base64';
import FallbackSpinner from './common/loader'
import { useTranslation } from 'react-i18next';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ConfigModel from './ConfigModel'
import { useSelector } from 'react-redux'
import '../../i18n';
import MonacoEditor from './MonacoEditor'
import Snackbar from '@mui/material/Snackbar';

interface TabPanelProps {
    children?: ReactNode
    index: number
    value: number
}
export interface PathParamsI {
    name: string
    value: string
}
export interface restImportConfigI {
    url?: string
    projectId: string
    httpMethod?: "GET" | "POST" | "DELETE" | "HEAD" | "PATCH" | "PUT"
    useProxy?: boolean
    httpAuth?: {
        type: "NONE" | "BASIC" | "OAUTH2",
        providerId?: string,
    },
    headerParams?: HeaderAndQueryI[]
    queryParams?: HeaderAndQueryI[]
    bodyParams?: string
    userName?: string
    userPassword?: string
    multipartParams?: BodyParamsI[]
    contentType?: string,
    proxy_conf: APII,
    error: {
        errorMethod: "default" | "toast" | "customFunction",
        errorFunction: (msg: string, response?: AxiosResponse) => void,
        errorMessageTimeout?: number | null
    },
    viewMode: boolean,
    setServiceName: string,
    setResponseHeaders?: any,
    setResponse?: any,
    loggenInUserId?: string,
    loggenInUserName?: string,
    appEnvVariables: HeaderAndQueryI[],
    monacoEditorURL: string,
    responseBlockHeight?: number,
    handleResponse: (request: AxiosRequestConfig, response?: AxiosResponse, settingsUploadResponse?: any) => void,
    hideMonacoEditor: (value: boolean) => void,
    getServiceName: (value: string) => void,
    getUseProxy: (value: boolean) => void
}
export interface ICustomAxiosConfig extends AxiosRequestConfig {
    useProxy?: boolean,
    authDetails?: null | {
        type: string,
        providerId?: string,
    },
}
export interface IToastError {
    message: string,
    type: "error" | 'info' | 'success' | 'warning'
}

interface APII {
    base_path: string,
    proxy_path: string,
    list_provider: string,
    getprovider: string,
    addprovider: string,
    authorizationUrl: string,
    project_id?: string,
    settingsUpload: string,
}
function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
            style={{ margin: "20px" }}
        >
            {value === index && (
                <Box>
                    {children}
                </Box>
            )}
        </div>
    );
}
export const defaultContentTypes = [
    {
        label: "application/json", value: "application/json"
    },
    {
        label: 'application/octet-stream', value: 'application/octet-stream'
    },
    {
        label: 'application/pdf', value: 'application/pdf'
    },
    {
        label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded'
    },
    {
        label: 'application/xml', value: "application/xml"
    },
    {
        label: 'multipart/form-data', value: 'multipart/form-data'
    },
    {
        label: 'text/html', value: 'text/html'
    },
    {
        label: 'text/plain', value: 'text/plain'
    },
    {
        label: 'text/xml', value: 'text/xml'
    },
]
declare global {
    interface Window {
        google: any;
    }
}

const useProxyTooltip = () => {
    return (
        <div>
            <p style={{ fontSize: 16 }}>
                Disable the Use Proxy to make a direct call to the target API for bypassing the proxy server.
                There may be issues if the API does not allow Cross Origin Resource Sharing.<br /><br />
                <u>Note</u>: Use Proxy should be enabled if you want to configure a Header or Query param as a Server Side Property. A server side param is sent from the proxy server and is hidden from the UI.
            </p>
        </div>
    )
}
const withCredentialsTooltip = () => {
    return (
        <div>
            <p style={{ fontSize: 16 }}>Check this if the cookies from the endpoint API should be set and honored by the browser.</p>
        </div>
    )
}

export default function RestImport({ language, restImportConfig }: { language: string, restImportConfig: restImportConfigI }) {
    const theme = createTheme({
        typography: {
            fontSize: 16, // Adjust the font size as needed
        },
    });
    const state_val = "eyJtb2RlIjoiZGVzaWduVGltZSIsInByb2plY3RJZCI6IldNUFJKMmM5MTgwODg4OWE5NjQwMDAxOGExYzE0YjBhNzI4YTQifQ=="
    const httpMethods = ["GET", "POST", "DELETE", "HEAD", "PATCH", "PUT"]
    const httpAuthTypes = ["NONE", 'BASIC', 'OAUTH2']
    const defaultValueforHandQParams = { name: '', value: '', type: 'string' }
    const { t: translate, i18n } = useTranslation();
    const [apiURL, setapiURL] = useState(restImportConfig?.url || '')
    const [httpMethod, sethttpMethod] = useState<"GET" | "POST" | "DELETE" | "HEAD" | "PATCH" | "PUT">(restImportConfig?.httpMethod || 'GET')
    const [useProxy, setuseProxy] = useState(restImportConfig?.useProxy === true ? true : false)
    const [withCredentials, setwithCredentials] = useState(false)
    const [requestTabValue, setrequestTabValue] = useState(0)
    const [responseTabValue, setresponseTabValue] = useState(0)
    const [httpAuth, sethttpAuth] = useState<"NONE" | "BASIC" | "OAUTH2">(restImportConfig?.httpAuth?.type || 'NONE')
    const [providerOpen, setproviderOpen] = useState(false)
    const [headerParams, setheaderParams] = useState<HeaderAndQueryI[]>(restImportConfig?.headerParams?.concat(defaultValueforHandQParams) || [defaultValueforHandQParams])
    const [queryParams, setqueryParams] = useState<HeaderAndQueryI[]>(restImportConfig?.queryParams?.concat(defaultValueforHandQParams) || [defaultValueforHandQParams])
    const [bodyParams, setbodyParams] = useState(restImportConfig?.bodyParams || '')
    const [multipartParams, setmultipartParams] = useState<BodyParamsI[]>(restImportConfig?.multipartParams?.concat({ name: '', value: '', type: 'file', filename: '' }) || [{ name: '', value: '', type: 'file', filename: '' }])
    const [pathParams, setpathParams] = useState<PathParamsI[]>([])
    const [contentType, setcontentType] = useState(restImportConfig?.contentType || 'application/json')
    const [addCustomType, setaddCustomType] = useState(false)
    const [contentTypes, setcontentTypes] = useState(defaultContentTypes)
    const [newContentType, setnewContentType] = useState('')
    const [response, setresponse] = useState<AxiosResponse>({ headers: restImportConfig.setResponseHeaders, data: restImportConfig.setResponse || undefined } as any)
    const [userName, setuserName] = useState(restImportConfig?.userName || '')
    const [userPassword, setuserPassword] = useState(restImportConfig?.userPassword || '')
    const [loading, setloading] = useState(false)
    const [providerId, setProviderId] = useState(restImportConfig.httpAuth?.providerId)
    const [configOpen, setConfigOpen] = useState(false)
    const [alertMsg, setAlertMsg] = useState<boolean>(false)
    const selectedProvider = useSelector((store: any) => store.slice.selectedProvider)
    const [serviceName, setserviceName] = useState(restImportConfig.setServiceName || "")
    const [serviceNameEnabled, setserviceNameEnabled] = useState(true)
    const providerAuthURL = useSelector((store: any) => store.slice.providerAuthURL)
    const editorRef: any = useRef(null)
    const [errorMessage, seterrorMessage] = useState<IToastError>({ type: 'error', message: '' })
    const [handleToastOpen, sethandleToastOpen] = useState(false)
    const [editorLanguage, seteditorLanguage] = useState('json')
    var multiParamInfoList: any[] = []
    var oAuthRetry = true

    useEffect(() => {
        if (restImportConfig?.contentType) {
            const existingContentType = contentTypes.some(contentType =>
                contentType.value === restImportConfig?.contentType
            );
            if (!existingContentType) {
                setcontentTypes((prevContentTypes: any) => [
                    ...prevContentTypes,
                    { label: restImportConfig.contentType, value: restImportConfig.contentType },
                ]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restImportConfig?.contentType])

    useEffect(() => {
        if (!window.google) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            document.head.appendChild(script);
        }
    }, [])

    useEffect(() => {
        setProviderId(selectedProvider.providerId)
    }, [selectedProvider])

    useEffect(() => {
        i18n.changeLanguage(language);
        handleChangeResponseTabs(null, responseTabValue)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [response])

    const handleToastClose = (_event?: SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway')
            return;
        sethandleToastOpen(false)
    }
    function handleToastError(error: IToastError, response?: AxiosResponse) {
        if (restImportConfig.error.errorMethod === 'default') {
            seterrorMessage({ type: error.type, message: error.message })
            error.message && setAlertMsg(true)
            if (restImportConfig.error.errorMessageTimeout) {
                return setTimeout(() => {
                    setAlertMsg(false)
                }, restImportConfig.error.errorMessageTimeout);
            }
        }
        if (restImportConfig.error.errorMethod === 'toast') {
            seterrorMessage({ type: error.type, message: error.message })
            sethandleToastOpen(true)
            return null
        }
        if (restImportConfig.error.errorMethod === 'customFunction')
            return restImportConfig.error.errorFunction(error.message, response)
    }
    const getPathParams = () => {
        try {
            let paths = retrievePathParamNamesFromURL(apiURL.split("?")[0], "{", "}")
            if (paths.length > 0) {
                const updatedPathParams: PathParamsI[] = []
                const isThisANewPath = (name: string): boolean => {
                    let newPath = true
                    for (const pathParam of pathParams) {
                        if (pathParam.name === name) {
                            if (!updatedPathParams.some(e => e.name === name)) {
                                updatedPathParams.push({ name, value: pathParam.value })
                                newPath = false
                                break
                            }
                        }
                    }
                    return newPath
                }
                paths.forEach((path) => {
                    if (path) {
                        if (isThisANewPath(path)) {
                            if (!updatedPathParams.some(pathParam => pathParam.name === path))
                                updatedPathParams.push({ name: path, value: "" })
                            else {
                                throw new Error('Path parameters cannot have duplicates')
                            }
                        }
                    }
                    else {
                        throw new Error('Please enter a valid path parameter')
                    }
                })
                const queryParamsFromUrl = retrieveQueryDetailsFromURL(apiURL)
                const duplicates = findDuplicatesByComparison(updatedPathParams, [...headerParams, ...queryParamsFromUrl], "name")
                if (duplicates.length > 0) {
                    let updatedURL = apiURL
                    let duplicatePathNames = ''
                    setpathParams(removeDuplicatesByComparison(updatedPathParams, duplicates, "name"))
                    duplicates.forEach((duplicate, index) => {
                        const duplicatePath = duplicate.name
                        duplicatePathNames += index !== duplicates.length - 1 ? `${duplicatePath},` : duplicatePath
                        updatedURL = updatedURL.replace(`/{${duplicatePath}}`, '')
                    })
                    setapiURL(updatedURL)
                    handleToastError({ message: `Parameters cannot have duplicates, removed the duplicates[${duplicatePathNames}]`, type: 'error' })
                } else {
                    setpathParams(updatedPathParams)
                }
            }
            else
                setpathParams([])
        } catch (error: any) {
            handleToastError({ message: error.message, type: 'error' })
        }
    }
    const handleCloseProvider = () => setproviderOpen(false)
    const handleChangeapiURL = (value: string) => setapiURL(value)
    const handleChangeHeaderParams = (data: HeaderAndQueryI[]) => setheaderParams(data)
    const handleChangeQueryParams = (data: HeaderAndQueryI[]) => setqueryParams(data)
    const handlemultipartParams = (data: BodyParamsI[]) => setmultipartParams(data)
    const handleChangeWithCredentials = (event: ChangeEvent<HTMLInputElement>) => setwithCredentials(event.target.checked)
    const handleChangehttpAuth = (event: SelectChangeEvent) => sethttpAuth(event.target.value as any)
    const handleChangecontentType = (event: SelectChangeEvent) => setcontentType(event.target.value)
    const handleChangeHeaderTabs = (_event: SyntheticEvent, newValue: number) => setrequestTabValue(newValue);
    const handleChangeProxy = (event: ChangeEvent<HTMLInputElement>) => {
        restImportConfig.getUseProxy(event.target.checked)
        setuseProxy(event.target.checked)
        if (event.target.checked) setwithCredentials(!event.target.checked)
    };
    const handlePathParamsChanges = (value: string, currentIndex: number) => {
        const pathParamsClone = [...pathParams]
        pathParamsClone.map((data, index) => {
            if (index === currentIndex)
                data.value = value
            return data
        })
        setpathParams(pathParamsClone)
    }
    const handleChangehttpMethod = (event: SelectChangeEvent) => {
        sethttpMethod(event.target.value as any)
        handleChangeHeaderTabs(null as any, 0)
    }
    const handleChangeResponseTabs = (_event: any, newValue: number) => {
        newValue === 0 ? restImportConfig.hideMonacoEditor(false) : restImportConfig.hideMonacoEditor(true)
        setresponseTabValue(newValue)
    };
    const handleQueryChange = () => {
        try {
            if (apiURL !== '') {
                const query = apiURL?.split('?')[1]
                const queries = query?.split('&')
                if (queries?.length > 0) {
                    const queryNames = queries.map(query => ({ name: query.split('=')[0], value: query.split('=')[1] }))
                    let updatedQueryParams: HeaderAndQueryI[] = []
                    const isThisNewQuery = (name: string, value: string): boolean => {
                        let newQuery = true
                        for (const query of queryParams) {
                            if (query.name === name) {
                                if (!updatedQueryParams.some(data => data.name === name)) {
                                    const valueArray = value.split(',')
                                    const valueToSet = constructCommaSeparatedUniqueQueryValuesString(valueArray)
                                    updatedQueryParams.push({ name, value: valueToSet, type: query.type })
                                    newQuery = false
                                    break
                                } else {
                                    const queryIndex = updatedQueryParams.findIndex(data => data.name === name)
                                    const valueCollection = [...updatedQueryParams[queryIndex].value.split(','), ...value.split(',')]
                                    const valueToSet = constructCommaSeparatedUniqueQueryValuesString(valueCollection)
                                    updatedQueryParams[queryIndex].value = valueToSet
                                    newQuery = false
                                    break
                                }
                            }
                        }
                        return newQuery
                    }
                    queryNames.forEach(query => {
                        const key = query.name
                        const value = query.value
                        if (key && value) {
                            if (isThisNewQuery(key, value)) {
                                if (updatedQueryParams.some(data => data.name === key)) {
                                    const queryIndex = updatedQueryParams.findIndex(data => data.name === key)
                                    const valueCollection = [...updatedQueryParams[queryIndex].value.split(','), ...value.split(',')]
                                    const valueToSet = constructCommaSeparatedUniqueQueryValuesString(valueCollection)
                                    updatedQueryParams[queryIndex].value = valueToSet
                                } else {
                                    const valueArray = value.split(',')
                                    const valueToSet = constructCommaSeparatedUniqueQueryValuesString(valueArray)
                                    updatedQueryParams.push({ name: key, value: valueToSet, type: 'string' })
                                }
                            }
                        } else
                            throw new Error('Please enter a valid query parameter')
                    })
                    const paths = retrievePathParamNamesFromURL(apiURL.split("?")[0], "{", "}")
                    const pathParamsClone = paths.map(path => {
                        return { "name": path }
                    })
                    const duplicates = findDuplicatesByComparison(updatedQueryParams, [...headerParams, ...pathParamsClone], "name")
                    if (duplicates.length > 0) {
                        let duplicateQueryNames = ''
                        const queryArrayWithoutDuplicates = removeDuplicatesByComparison(updatedQueryParams, duplicates, "name")
                        queryArrayWithoutDuplicates.push({ name: '', value: '', type: 'string' })
                        setqueryParams(queryArrayWithoutDuplicates)
                        duplicates.forEach((duplicate, index) => {
                            const duplicateQuery = duplicate.name
                            duplicateQueryNames += index !== duplicates.length - 1 ? `${duplicateQuery},` : duplicateQuery
                        })
                        const newQueryPart = constructUpdatedQueryString(queryArrayWithoutDuplicates)
                        const originalURL = apiURL.split('?')[0]
                        setapiURL(originalURL + newQueryPart)
                        handleToastError({ message: `Queries cannot have duplicates, removed the duplicates[${duplicateQueryNames}]`, type: 'error' })
                    } else {
                        updatedQueryParams.push({ name: '', value: '', type: 'string' })
                        setqueryParams(updatedQueryParams)
                        const newQueryPart = constructUpdatedQueryString(updatedQueryParams)
                        const originalURL = apiURL.split('?')[0]
                        setapiURL(originalURL + newQueryPart)
                    }
                } else {
                    setqueryParams([{ name: '', value: '', type: 'string' }])
                }
            } else setqueryParams([{ name: '', value: '', type: 'string' }])
        } catch (error: any) {
            handleToastError({ message: error.message, type: 'error' })
        }
    }
    const handleAddCustomContentType = () => {
        if (newContentType && !contentTypes.find(e => e.value === newContentType)) {
            const contentTypesClone = [...contentTypes]
            contentTypesClone.push({
                label: newContentType,
                value: newContentType
            })
            setcontentTypes(contentTypesClone)
            setaddCustomType(false)
            setcontentType(newContentType)
            setnewContentType("")
        } else if (newContentType && contentTypes.find(e => e.value === newContentType)) {
            setaddCustomType(false)
            setcontentType(newContentType)
            setnewContentType("")
        }
        else
            handleToastError({ message: "Please add a custom content type", type: 'error' })
    }
    const validateAndAddQueryAtLastRow = (requestAPI: string) => {
        if (queryParams && queryParams[queryParams.length - 1].name && queryParams[queryParams.length - 1].value) {
            const queryName = queryParams[queryParams.length - 1].name
            const queryValue = queryParams[queryParams.length - 1].value
            const queryParamsClone = [...queryParams]
            const lastRowValuesArray = queryValue.split(',')
            const lastRowValues = lastRowValuesArray.filter((value, index) => value && lastRowValuesArray.indexOf(value) === index)
            const duplicates = findDuplicatesByComparison([{ name: queryName, value: queryValue, type: 'string' }], [...headerParams, ...pathParams], "name")
            if (duplicates.length === 0) {
                const queriesArrayFromUrl: HeaderAndQueryI[] = retrieveQueryDetailsFromURL(requestAPI)
                if (queriesArrayFromUrl.some(query => query.name === queryName)) {
                    const queryIndex = queriesArrayFromUrl.findIndex(data => data.name === queryName)
                    const valueCollection = [...queriesArrayFromUrl[queryIndex].value.split(','), ...lastRowValues]
                    const valueToSet = constructCommaSeparatedUniqueQueryValuesString(valueCollection)
                    queriesArrayFromUrl[queryIndex].value = valueToSet
                    queryParamsClone[queryParamsClone.findIndex(data => data.name === queryName)].value = valueToSet
                    queryParamsClone[queryParamsClone.length - 1] = { name: '', type: 'string', value: '' }
                } else {
                    queriesArrayFromUrl.push({ name: queryName, value: lastRowValues.join(','), type: 'string' })
                    queryParamsClone.push({ name: '', type: 'string', value: '' })
                }
                const newQueryString = constructUpdatedQueryString(queriesArrayFromUrl)
                const urlWithoutQuery = requestAPI.split('?')[0]
                requestAPI = urlWithoutQuery + newQueryString
                setapiURL(requestAPI)
                setqueryParams(queryParamsClone)
            } else
                throw new Error(`parameter "${queryName}" already exists`)
        }
    }
    const handleTestClick = async () => {
        try {
            if (apiURL.length > 0) {
                setAlertMsg(false)
                let header: any = {}
                let requestAPI = apiURL
                const contentTypeCheck = contentType === 'multipart/form-data' ? true : false
                if (isValidUrl(requestAPI)) {
                    headerParams.forEach((data, index) => {
                        if (data.name && data.value) {
                            if (data.name === 'Authorization' && header['Authorization'])
                                throw new Error(`Parameter "Authorization" already exists`)
                            header[data.name] = data.value
                            index === headerParams.length - 1 && setheaderParams([...headerParams, { name: '', value: '', type: 'string' }])
                        }
                    })
                    pathParams.forEach((params) => {
                        if (params.value.trim() !== "")
                            requestAPI = requestAPI.replace(`{${params.name}}`, params.value)
                        else
                            throw new Error(translate("PATHPARAMSALERT"))
                    })
                    validateAndAddQueryAtLastRow(requestAPI)
                    if (httpAuth === "BASIC") {
                        if (userName.trim() === "")
                            throw new Error("Please enter a username for basic authentication")
                        if (userPassword.trim() === "")
                            throw new Error("Please enter a password for basic authentication")
                        header["Authorization"] = 'Basic ' + encode(userName + ':' + userPassword)
                    }
                    if (httpAuth === "OAUTH2") {
                        if (selectedProvider.providerId === '') {
                            return handleToastError({ message: "Please select a provider", type: "error" })
                        }
                        let codeVerifier: string;
                        const clientId = selectedProvider.clientId;
                        let redirectUri = restImportConfig?.proxy_conf?.base_path + `oauth2/${selectedProvider.providerId}/callback`;
                        const responseType = "code";
                        const state = state_val
                        const scope = selectedProvider.scopes.length > 0 ? selectedProvider.scopes.map((scope: { value: any }) => scope.value).join(' ') : '';
                        let childWindow: any;
                        var authUrl: string
                        const isToken = window.localStorage.getItem(`${providerId}.access_token`);
                        if (isToken) {
                            header['Authorization'] = `Bearer ${isToken}`
                        } else {
                            if (selectedProvider.oAuth2Pkce && selectedProvider.oAuth2Pkce.enabled) {
                                if (selectedProvider.providerId === "google") {
                                    if (window && window?.google) {
                                        const client = window?.google?.accounts.oauth2.initTokenClient({
                                            client_id: clientId,
                                            scope: scope,
                                            callback: (tokenResponse: any) => {
                                                if (tokenResponse && tokenResponse.access_token) {
                                                    header['Authorization'] = `Bearer ` + tokenResponse.access_token
                                                    handleRestAPI(header);
                                                    setloading(false)
                                                }
                                            },
                                            error_callback: (error: any) => {
                                                if (error.type === "popup_closed") {
                                                    const access_token = window.localStorage.getItem(`${providerId}.access_token`) || null
                                                    header['Authorization'] = `Bearer ` + null
                                                    access_token !== null && handleRestAPI(header)
                                                    setloading(false)
                                                }
                                            },
                                        }) as any;
                                        client.requestAccessToken();
                                    }
                                } else {
                                    redirectUri = restImportConfig?.proxy_conf?.base_path + 'studio/oAuthCallback.html'
                                    const challengeMethod = selectedProvider.oAuth2Pkce.challengeMethod
                                    codeVerifier = generateRandomCodeVerifier();
                                    const data = Uint8Array.from(codeVerifier.split("").map(x => x.charCodeAt(0)))
                                    window.crypto.subtle.digest("SHA-256", data)
                                        .then((hashBuffer: ArrayBuffer) => {
                                            const codeChallenge = challengeMethod === "S256" ? base64URLEncode(hashBuffer) : codeVerifier;
                                            const pkce_state = { providerId: selectedProvider.providerId, suffix: '.access_token', requestSourceType: "web", flow: 'pkce' };
                                            let authUrlArr = selectedProvider.authorizationUrl.split('?'), connector;
                                            if (authUrlArr.length === 1) {
                                                //query params don't exist
                                                connector = '?';
                                            } else if (authUrlArr.length > 1 && authUrlArr[1] !== '') {
                                                //query params exist. Append & instead of ?.
                                                connector = '&';
                                            } else {
                                                //nothing exists after '?'. client_id can be directly appended;
                                                connector = '';
                                            }
                                            const commonUrl = selectedProvider.authorizationUrl + connector + 'client_id=' + clientId + '&redirect_uri=' + redirectUri + '&state=' + encodeURIComponent(JSON.stringify(pkce_state)) + '&scope=' + encodeURIComponent(scope);
                                            const implicitUri = commonUrl + '&response_type=code&code_challenge=' + codeChallenge + '&code_challenge_method=' + challengeMethod;
                                            authUrl = selectedProvider.authorizationUrl + `?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${pkce_state}&scope=${scope}&&code_challenge=${codeChallenge}&code_challenge_method=${challengeMethod}`;
                                            childWindow = window.open(implicitUri, "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=0,left=0,width=400,height=600");
                                        })
                                        .catch((error: any) => {
                                            console.error("Error calculating code challenge:", error);
                                        });
                                }
                            } else {
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                authUrl = selectedProvider.authorizationUrl + `?client_id=${clientId}&redirect_uri=${(redirectUri)}&response_type=${responseType}&state=${state}&scope=${(scope)}`;
                                childWindow = window.open(providerAuthURL, "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=0,left=0,width=400,height=600");
                            }
                            // providerAuthURL
                            if ((selectedProvider.providerId === 'google' && !selectedProvider.oAuth2Pkce) || selectedProvider.providerId !== 'google') {
                                const interval = setInterval(() => {
                                    if (childWindow?.closed) {
                                        const access_token = window.localStorage.getItem(`${providerId}.access_token`) || null
                                        clearInterval(interval);
                                        header['Authorization'] = `Bearer ` + null
                                        access_token !== null && handleRestAPI(header)
                                    }
                                }, 1000);
                                const messageHandler = async (event: { origin: string; data: { tokenData: any; code: string; error: any } }) => {
                                    const access_token = window.localStorage.getItem(`${providerId}.access_token`) || null
                                    if (access_token) {
                                        if (selectedProvider.oAuth2Pkce.enabled) {
                                            getAccessToken(access_token, codeVerifier)
                                            setloading(false)
                                        } else {
                                            header['Authorization'] = `Bearer ${access_token}` //tokenData.access_token
                                            handleRestAPI(header);
                                        }
                                        clearInterval(interval);
                                        // const tokenData = JSON.parse(event.data.tokenData).access_token  //for local testing 
                                        window.removeEventListener('message', messageHandler);
                                    } else if (event.data.code) { //PKCE flow 
                                        clearInterval(interval)
                                        getAccessToken(event.data.code, codeVerifier)
                                        setloading(false)
                                        window.removeEventListener('message', messageHandler);
                                    }
                                }
                                window.addEventListener('message', messageHandler);
                            }
                            return
                        }
                    }
                    function getBody(): FormData | {} {
                        const jsonObject: any = {
                            endpointAddress: requestAPI,
                            method: httpMethod,
                            contentType: contentType,
                            requestBody: contentTypeCheck ? "" : bodyParams,
                            headers: header,
                            authDetails: httpAuth === "NONE" ? null : httpAuth === "BASIC" ? { type: "BASIC" } : { type: "OAUTH2", providerId: providerId },
                        }
                        const formDataOject = new FormData()
                        if (contentTypeCheck) {
                            multiParamInfoList = []
                            multipartParams.forEach((data, index) => {
                                if (data.name && data.value) {
                                    if (data.type === 'file') {
                                        formDataOject.append(data.name, data.value)
                                        multiParamInfoList.push({ name: data.name, type: data.type, list: true })
                                    } else {
                                        formDataOject.append(data.name, new Blob([data.value], { type: 'application/json' }))
                                        multiParamInfoList.push({ name: data.name, type: 'string', list: false, testValue: data.value, contentType: data.type })
                                    }
                                }
                                if (index === multipartParams.length - 1 && data.name.trim() !== '' && data.value) {
                                    setmultipartParams([...multipartParams, { name: '', value: '', type: 'file' }])
                                }
                            })
                            jsonObject['multiParamInfoList'] = multiParamInfoList
                        }
                        const blob = new Blob([JSON.stringify(jsonObject)], { type: 'application/json' });
                        formDataOject.append('wm_httpRequestDetails', blob)
                        const data = contentTypeCheck ? formDataOject : jsonObject
                        return data
                    }
                    const configWOProxy: ICustomAxiosConfig = {
                        url: requestAPI,
                        headers: header,
                        method: httpMethod,
                        data: getBody(),
                        authDetails: httpAuth === "NONE" ? null : httpAuth === "BASIC" ? { type: "BASIC" } : { type: "OAUTH2", providerId: providerId },
                        useProxy: useProxy,
                        withCredentials: withCredentials
                    }
                    const url = restImportConfig?.proxy_conf?.base_path + restImportConfig?.proxy_conf?.proxy_path
                    const configWProxy: ICustomAxiosConfig = {
                        url: url,
                        data: getBody(),
                        method: "POST",
                        headers: {
                            'Content-Type': contentTypeCheck ? contentType : 'application/json',
                        },
                        withCredentials: true,
                        useProxy: useProxy,
                    }
                    setloading(true)
                    const config = useProxy ? configWProxy : configWOProxy
                    const response: any = await Apicall(config as AxiosRequestConfig)
                    if (response.status >= 200 && response.status < 300) {
                        if (providerId) {
                            if (response.status === 401 || response.data.statusCode === 401) {
                                oAuthRetryF(config)
                            }
                        }
                        const settingsUploadData = await settingsUpload(config, response)
                        if (settingsUploadData) {
                            setserviceNameEnabled(false)
                            if (!restImportConfig.viewMode) {
                                restImportConfig.getServiceName(settingsUploadData?.serviceId)
                                setserviceName(settingsUploadData?.serviceId)
                            }
                            handleResponse(response, config, settingsUploadData)
                        }
                    } else {
                        setserviceNameEnabled(true)
                        handleResponse(response, config)
                    }
                    setloading(false)
                } else
                    throw new Error(translate("VALID_URL_ALERT"))
            }
            else
                throw new Error(translate("VALID_URL_ALERT"))
        } catch (error: any) {
            console.error(error)
            setloading(false)
            handleToastError({ message: error.message, type: 'error' })
        }
    }
    function handleResponse(response: any, request?: any, settingsUploadData?: any): void {
        let responseValue;
        setserviceNameEnabled(false)
        if (useProxy) {
            if (response.status >= 200 && response.status < 300)
                if (response.data.statusCode >= 200 && response.data.statusCode < 300)
                    responseValue = { data: checkXMLorJSON(response.data.responseBody), status: response?.data.statusCode, headers: response?.data.headers }
                else {
                    responseValue = { data: checkXMLorJSON(response.data.responseBody), status: response?.data.statusCode, headers: response?.data.headers }
                    handleToastError({ message: httpStatusCodes.get(response?.data.statusCode) as string, type: 'error' }, response)
                }
            else
                responseValue = { data: response?.data?.errors.error[0].paramaters[0] || response?.response?.data.status + " " + httpStatusCodes.get(response?.response?.data.status), status: response?.response?.data.status, headers: response?.response?.headers }
        }
        else {
            if (response.status >= 200 && response.status < 300) {
                responseValue = { data: checkXMLorJSON(response?.data), status: response?.status, headers: response?.headers }
            }
            else if (response.response !== undefined) {
                responseValue = { data: response?.response.status + " " + httpStatusCodes.get(response.response?.status), status: response?.response.status, headers: response.response?.headers }
                handleToastError({ message: httpStatusCodes.get(response.response?.status) as string, type: 'error' }, response)
            }
            else {
                const responseData = response?.response?.data.status + " " + httpStatusCodes.get(response?.response?.data.status)
                responseValue = { data: response.code === "ERR_NETWORK" ? translate("CORS_ERROR_MESSAGE") : responseData, status: response.code, headers: {} }
            }
        }
        editorRef.current.setValue(responseValue.data)
        setresponse(responseValue as AxiosResponse)
        request.url = apiURL
        setloading(false)
        restImportConfig.handleResponse(request, responseValue as AxiosResponse, settingsUploadData)
    }
    function checkXMLorJSON(responseValue: any): any {
        let response = responseValue
        try {
            if ('string' === typeof responseValue)
                response = JSON.stringify(JSON.parse(responseValue), undefined, 2)
            else if ('object' === typeof responseValue)
                response = JSON.stringify(JSON.parse(JSON.stringify(responseValue)), undefined, 2)
        } catch (error) {
            seteditorLanguage('plaintext')
        }
        return response
    }
    async function settingsUpload(request: any, response: any) {
        const headers = response.headers;
        const constructHeaders: any = {};
        if (headerParams.length > 1) {
            headerParams?.forEach((obj) => {
                if (obj.name !== '' && obj.value !== '')
                    constructHeaders[obj.name] = obj.value;
            });
        }
        const data = {
            authDetails:
                useProxy
                    ? request?.data.authDetails
                    : request?.authDetails,
            contentType: contentType,
            method: httpMethod,
            endpointAddress: apiURL,
            headers: constructHeaders,
            multiParamInfoList: multiParamInfoList,
            sampleHttpResponseDetails: {
                headers: useProxy ? response.data.headers : headers,
                responseBody: useProxy ? response.data.responseBody : JSON.stringify(response?.data), // when useproxy is true return response.responseBody
                convertedResponse: null,
                statusCode: response?.status,
            },
            requestBody: bodyParams
        };
        const dataConfig: AxiosRequestConfig = {
            url: restImportConfig.proxy_conf.base_path + restImportConfig.proxy_conf.settingsUpload,
            data,
            method: 'POST',
            withCredentials: true,
        }
        const settingsUploadResponse: any = await Apicall(dataConfig)
        if (response.status >= 200 && response.status < 300) {
            let settingsUploadResponseData = settingsUploadResponse.data
            const params: any[] = getParamsWithTypes(settingsUploadResponseData).paramaters
            const firstKey = getParamsWithTypes(settingsUploadResponseData).firstKey
            const secondKey = getParamsWithTypes(settingsUploadResponseData).secondKey
            const headers = [...headerParams]
            const query = [...queryParams]
            const multipart = [...multipartParams]
            const paths = [...pathParams]
            if (params && params.length > 0) {
                params?.forEach((param) => {
                    if (param.in === 'header') {
                        for (const key in headers) {
                            if (param.name === headers[key].name) {
                                const type = headerParams.find(param => param.name === headers[key].name)?.type
                                param['format'] = type
                                param.items.type = type
                                if (headers[key].type === 'APP_ENVIRONMENT') {
                                    param.items.type = "__APP_ENV__" + headers[key].name
                                    param['format'] = "__APP_ENV__" + headers[key].name
                                    param["x-WM-VARIABLE_KEY"] = headers[key].name
                                    param["x-WM-VARIABLE_TYPE"] = headers[key].type
                                }
                            }
                        }
                    }
                    else if (param.in === 'query') {
                        for (const key in query) {
                            if (param.name === query[key].name) {
                                const type = queryParams.find(param => param.name === query[key].name)?.type
                                param['format'] = type
                                if (queryParams[key].type === 'APP_ENVIRONMENT') {
                                    param['format'] = "__APP_ENV__" + query[key].name
                                    param["x-WM-VARIABLE_KEY"] = query[key].name
                                    param["x-WM-VARIABLE_TYPE"] = query[key].type
                                }
                            }
                        }
                    }
                    else if (param.in === 'formData') {
                        for (const key in multipart) {
                            if (param.name === multipart[key].name) {
                                const type = multipartParams.find(param => param.name === multipart[key].name)?.type
                                param['format'] = type
                                if (param['type'] === 'array')
                                    param.items.type = type
                            }
                        }
                    }
                })
            }
            if (paths.length > 0) {
                paths.forEach(path => {
                    params.push({
                        format: "string",
                        in: "path",
                        type: "string",
                        name: path.name,
                        "x-WM-VARIABLE_KEY": "",
                        "x-WM-VARIABLE_TYPE": "PROMPT"
                    })
                })
            }
            settingsUploadResponseData.swagger.paths[firstKey][secondKey].parameters = params
            settingsUploadResponseData['proxySettings'] = {
                mobile: useProxy ? 'PROXY' : 'DIRECT',
                web: useProxy ? 'PROXY' : 'DIRECT',
                withCredentials: withCredentials,
            };
            settingsUploadResponseData['serviceId'] = serviceName.trim() !== '' ? serviceName : settingsUploadResponseData['serviceId']
            return settingsUploadResponseData
        }
        else
            handleToastError({ message: "Failed to get settings upload response", type: 'error' }, settingsUploadResponse)
    }
    function getParamsWithTypes(response: any): { paramaters: any[], firstKey: string, secondKey: string } {
        const swaggerPaths = response.swagger.paths;
        const [firstKey] = Object.keys(swaggerPaths);
        const firstObject = swaggerPaths[firstKey];
        const [secondKey] = Object.keys(firstObject);
        const secondObject = firstObject[secondKey];
        const paramaters = secondObject.parameters || [];
        return { paramaters, firstKey, secondKey };
    }
    const handleCloseConfig = () => {
        setConfigOpen(false)
    }

    const handleRestAPI = async (header: object) => {
        const configWOProxy: ICustomAxiosConfig = {
            url: apiURL,
            headers: header,
            method: httpMethod,
            data: bodyParams,
            authDetails: { type: "OAUTH2", providerId: providerId }
        }
        const url = restImportConfig?.proxy_conf?.base_path + restImportConfig?.proxy_conf?.proxy_path
        const configWProxy: AxiosRequestConfig = {
            url: url,
            data: {
                "endpointAddress": apiURL,
                "method": httpMethod,
                "contentType": contentType,
                "requestBody": bodyParams,
                "headers": header,
                "authDetails": { type: "OAUTH2", providerId: providerId },
            },
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true
        }
        const config = useProxy ? configWProxy : configWOProxy
        setloading(true)
        const response: any = await Apicall(config as AxiosRequestConfig)
        if (response.status >= 200 && response.status < 300) {
            if (response.data.statusCode === 200) {
                const settingsUploadData = await settingsUpload(config, response)
                if (settingsUploadData) {
                    setserviceNameEnabled(false)
                    if (!restImportConfig.viewMode) {
                        restImportConfig.getServiceName(settingsUploadData?.serviceId)
                        setserviceName(settingsUploadData?.serviceId)
                    }
                    handleResponse(response, config, settingsUploadData)
                }
            }
            else if (response.data.statusCode === 401) {
                if (oAuthRetry) {
                    oAuthRetryF(config)
                }
                else {
                    handleOAuthError(config)
                }
            }
            else
                handleOAuthError(config)
        } else
            handleOAuthError(config)
        setloading(false)
    }
    function handleOAuthError(config: AxiosRequestConfig) {
        setserviceNameEnabled(true)
        handleResponse(response, config)
    }

    function oAuthRetryF(config: AxiosRequestConfig) {
        if (oAuthRetry) {
            window.localStorage.removeItem(`${providerId}.access_token`)
            oAuthRetry = false
            handleTestClick()
        }
        else {
            handleOAuthError(config)
        }
    }

    function generateRandomCodeVerifier() {
        const array = new Uint32Array(56 / 2);
        window.crypto.getRandomValues(array);
        return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
    }
    const base64URLEncode = (arrayBuffer: ArrayBuffer): string => {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    };
    const getAccessToken = async (code: string, codeVerifier: any) => {
        const reqParams = {
            grant_type: 'authorization_code',
            code: code,
            client_id: selectedProvider.clientId,
            code_verifier: codeVerifier,
            redirect_uri: restImportConfig?.proxy_conf?.base_path + 'studio/oAuthCallback.html',
        }
        const configToken: AxiosRequestConfig = {
            url: selectedProvider.accessTokenUrl,
            "headers": {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: "POST",
            data: reqParams
        }
        let header: any = {};
        headerParams?.forEach((data) => {
            if (data.name && data.value)
                header[data.name] = data.value
        })
        const response: any = await Apicall(configToken)
        if (response.status === 200) {
            header['Authorization'] = `Bearer ` + response.data.access_token
            window.localStorage.setItem(selectedProvider.providerId + "access_token", response.data.access_token);
            // const currentTimestamp = Math.floor(Date.now() / 1000);
            // const expiresIn = response.data.expires_in
            // const expirationTimestamp = currentTimestamp + expiresIn;
            // window.sessionStorage.setItem(selectedProvider.providerId + "expires_in", expirationTimestamp);
            handleRestAPI(header)
        } else {
            header['Authorization'] = `Bearer ` + null
            handleRestAPI(header)
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <Stack sx={{ height: "97vh" }} className='rest-import-ui'>
                {loading && <FallbackSpinner />}
                <Grid gap={1} className='cmnflx' container>
                    <Grid item md={12}>
                        {alertMsg && (
                            <Alert sx={{ py: 0 }} severity={errorMessage?.type} data-testid="default-error" onClose={() => setAlertMsg(false)}>{errorMessage.message}</Alert>
                        )}
                    </Grid>
                    <Grid sx={{ border: restImportConfig.viewMode ? '2px solid #ccc' : 'none', padding: restImportConfig.viewMode ? 3 : 0, backgroundColor: '#faf8f9' }} item md={12}>
                        <Stack spacing={5} direction={'row'} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                            <FormControl
                                disabled={restImportConfig.viewMode}
                                sx={{ minWidth: 120, color: "red" }} size='small'>
                                <Select
                                    name="wm-webservice-http-method"
                                    data-testid="http-method"
                                    value={httpMethod}
                                    sx={{
                                        backgroundColor: restImportConfig.viewMode ? '#eeeced' : 'none',
                                        "& .MuiInputBase-input.Mui-disabled": {
                                            WebkitTextFillColor: restImportConfig.viewMode ? "#000" : 'none',
                                        },
                                    }}
                                    onChange={handleChangehttpMethod}
                                >
                                    {httpMethods.map((httpMethod) => <MenuItem key={httpMethod} title={httpMethod} value={httpMethod}>{httpMethod}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField onBlur={() => {
                                getPathParams()
                                handleQueryChange()
                            }} name='wm-webservice-sample-url' autoFocus={true} value={apiURL} onChange={(e) => setapiURL(e.target.value.trim())} size='small' fullWidth label={translate('URL')} placeholder={translate('URL')} />
                            <Button name="wm-webservice-sample-test" onClick={handleTestClick} variant='contained'>{translate('TEST')}</Button>
                        </Stack>
                        <Grid mt={2} container>
                            <Grid item md={6}>
                                <Stack sx={{ cursor: "pointer" }} spacing={2} display={'flex'} alignItems={'center'} direction={'row'}>
                                    <Typography>{translate('SERVICE_NAME')}</Typography>
                                    <TextField value={serviceName}
                                        name="wm-webservice-service-name"
                                        sx={{
                                            backgroundColor: restImportConfig.viewMode ? '#eeeced' : 'none',
                                            "& .MuiInputBase-input.Mui-disabled": {
                                                WebkitTextFillColor: restImportConfig.viewMode ? "#000" : 'none',
                                            },
                                        }}
                                        onChange={(e) => {
                                            setserviceName(e.target.value)
                                            restImportConfig.getServiceName(e.target.value)
                                        }} disabled={serviceNameEnabled || restImportConfig.viewMode} size='small' />
                                </Stack>
                            </Grid>
                            <Grid item md={3}>
                                <Stack spacing={2} display={'flex'} alignItems={'center'} direction={'row'}>
                                    <Typography>{translate('USE_PROXY')}</Typography>
                                    <Switch name="wm-webservice-use-proxy" data-testid="proxy-switch" checked={useProxy} onChange={handleChangeProxy} />
                                    <Tooltip title={useProxyTooltip()}>
                                        <IconButton>
                                            <HelpOutlineIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Grid>
                            {!useProxy && <Grid item md={3}>
                                <Stack spacing={2} display={'flex'} alignItems={'center'} direction={'row'}>
                                    <Typography>{translate('WITH_CREDENTIALS')}</Typography>
                                    <Switch name="wm-webservice-with-credentials" data-testid="with-credentials" checked={withCredentials} onChange={handleChangeWithCredentials} />
                                    <Tooltip title={withCredentialsTooltip()}>
                                        <IconButton>
                                            <HelpOutlineIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Grid>}
                        </Grid>
                    </Grid>
                    <Grid sx={{ overflowY: 'auto' }} height={restImportConfig.responseBlockHeight ? `${restImportConfig.responseBlockHeight}px` : '300px'} item md={12}>
                        <Box data-testid="request-config-block" sx={{ width: '100%' }}>
                            <Box sx={{ borderColor: 'divider', backgroundColor: '#f3f5f6' }}>
                                <Tabs sx={{ minHeight: "30px", height: "45px" }} value={requestTabValue} onChange={handleChangeHeaderTabs}>
                                    <Tab title="wm-rest-authorization-params-header" label={translate("AUTHORIZATION")} />
                                    <Tab title="wm-rest-headers-params-header" label={translate("HEADER") + " " + translate("PARAMS")} />
                                    <Tab title="wm-rest-body-params-header" label={translate("BODY") + " " + translate("PARAMS")} disabled={httpMethod === "GET" ? true : false} />
                                    <Tab title="wm-rest-query-params-header" label={translate("QUERY") + " " + translate("PARAMS")} />
                                    <Tab title="wm-rest-path-params-header" label={translate("PATH") + " " + translate("PARAMS")} />
                                </Tabs>
                            </Box>
                            <Box sx={{ border: '1px solid #ccc' }}>
                                <CustomTabPanel value={requestTabValue} index={0}>
                                    <Grid spacing={2} className='cmnflx' container>
                                        <Grid item md={3}>
                                            <Typography>{translate('HTTP') + " " + translate("AUTHENTICATION")}</Typography>
                                        </Grid>
                                        <Grid item md={9}>
                                            <FormControl size='small' >
                                                <Select
                                                    name="wm-rest-http-auth"
                                                    data-testid="http-auth"
                                                    value={httpAuth}
                                                    onChange={handleChangehttpAuth}
                                                >
                                                    {httpAuthTypes.map((httpAuth) => <MenuItem key={httpAuth} title={translate(httpAuth)} value={httpAuth}>{httpAuth === "OAUTH2" ? "OAuth 2.0" : translate(httpAuth)}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        {httpAuth === "BASIC" && <>
                                            <Grid item md={3}>
                                                <Typography>{translate("USER_NAME")}</Typography>
                                            </Grid>
                                            <Grid item md={9}>
                                                <Stack direction={'row'}>
                                                    <TextField name="wm-webservice-advanced-username" value={userName} onChange={(e) => setuserName(e.target.value)} size='small' label={translate("USER_NAME")} placeholder={translate("USER_NAME")} />
                                                    <Tooltip title={translate("USER_NAME")}>
                                                        <IconButton>
                                                            <HelpOutlineIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Grid>
                                            <Grid item md={3}>
                                                <Typography>{translate("PASSWORD")}</Typography>
                                            </Grid>
                                            <Grid item md={9}>
                                                <Stack direction={'row'}>
                                                    <TextField name="wm-webservice-advanced-password" value={userPassword} onChange={(e) => setuserPassword(e.target.value)} size='small' label={translate("PASSWORD")} placeholder={translate("PASSWORD")} />
                                                    <Tooltip title={translate("PASSWORD")}>
                                                        <IconButton>
                                                            <HelpOutlineIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Grid>
                                        </>}
                                        {httpAuth === "OAUTH2" && <>
                                            <Grid item md={3}>
                                                <Typography>{translate("OAuth") + " " + translate("PROVIDER")}</Typography>
                                            </Grid>
                                            <Grid item md={9}>
                                                <Stack spacing={2} direction={'row'}>
                                                    <TextField disabled={!providerId ? true : false} sx={{ backgroundColor: providerId ? 'lightgray' : 'white' }} size='small' data-testid="provider-name" value={providerId} label={!providerId ? translate("NO") + " " + translate("PROVIDER") + " " + translate("SELECTED_YET") : ''} />
                                                    {
                                                        providerId && (
                                                            <Tooltip title={translate("Edit Provider")}>
                                                                <IconButton name='wm-webservice-edit-provider' title={translate("Edit Provider")} onClick={() => setConfigOpen(true)} data-testid='edit-provider'>
                                                                    <EditOutlinedIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )
                                                    }
                                                    <Button name='wm-webservice-select-provider' onClick={() => setproviderOpen(true)} variant='contained' data-testid='select-provider'>{translate("SELECT") + "/" + translate("ADD") + " " + translate("PROVIDER")}</Button>
                                                </Stack>
                                            </Grid>
                                        </>}
                                    </Grid>
                                </CustomTabPanel>
                                <CustomTabPanel value={requestTabValue} index={1}>
                                    <HeaderAndQueryTable restImportConfig={restImportConfig} handleToastError={handleToastError} from='header' headerParams={headerParams} queryParams={queryParams} pathParams={pathParams} value={headerParams} setValue={handleChangeHeaderParams} apiURL={apiURL} changeapiURL={handleChangeapiURL} />
                                </CustomTabPanel>
                                <CustomTabPanel value={requestTabValue} index={2}>
                                    <Stack spacing={1}>
                                        <Stack spacing={10} display={'flex'} alignItems={'center'} direction={'row'}>
                                            <Typography>{translate("CONTENT") + " " + translate("TYPE")}</Typography>
                                            <Stack spacing={3} display={'flex'} alignItems={'center'} direction={'row'}>
                                                <FormControl size='small' sx={{ width: "20em" }}>
                                                    <Select
                                                        name="wm-webservice-content-type"
                                                        value={contentType}
                                                        onChange={handleChangecontentType}
                                                        data-testid="select-content-type"
                                                    >
                                                        {contentTypes.map((data) => <MenuItem title={data.value} key={data.value} value={data.value}>
                                                            {translate(data.label)}
                                                        </MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                                <Tooltip title={translate("Choose appropriate content type")}>
                                                    <IconButton>
                                                        <HelpOutlineIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {addCustomType ? <Stack direction={'row'}>
                                                    <TextField name="wm-webservice-new-content-type" value={newContentType} onChange={(e) => setnewContentType(e.target.value)} size='small' data-testid='custom-type-field' />
                                                    <Tooltip title={translate("CLOSE")}>
                                                        <IconButton onClick={() => { setnewContentType(''); setaddCustomType(false) }}>
                                                            <CloseIcon name="wm-webservice-close-new-content-type" sx={{ cursor: 'pointer', color: 'black' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={translate("ADD")}>
                                                        <IconButton onClick={() => handleAddCustomContentType()}>
                                                            <DoneIcon name="wm-webservice-add-content-type" sx={{ cursor: 'pointer', color: 'black' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack> :
                                                    <Tooltip title={translate("CUSTOM_CONTENT_TYPE")}>
                                                        <IconButton onClick={() => setaddCustomType(true)}>
                                                            <AddIcon name="wm-webservice-add-new-content-type" sx={{ cursor: 'pointer', color: 'black' }} />
                                                        </IconButton>
                                                    </Tooltip>}
                                            </Stack>
                                        </Stack>
                                        {contentType === 'multipart/form-data' ? <MultipartTable handleToastError={handleToastError} value={multipartParams} setValue={handlemultipartParams} /> :
                                            <TextareaAutosize name="wm-webservice-body-type" style={{ padding: 2 }} value={bodyParams} onChange={(e) => setbodyParams(e.target.value)} minRows={8} placeholder={translate('REQUEST') + " " + translate('BODY') + ":" + translate('REQUEST_BODY_PLACEHOLDER')} />
                                        }
                                    </Stack>
                                </CustomTabPanel>
                                <CustomTabPanel value={requestTabValue} index={3}>
                                    <HeaderAndQueryTable restImportConfig={restImportConfig} handleToastError={handleToastError} from='query' headerParams={headerParams} queryParams={queryParams} pathParams={pathParams} value={queryParams} setValue={handleChangeQueryParams} apiURL={apiURL} changeapiURL={handleChangeapiURL} />
                                </CustomTabPanel>
                                <CustomTabPanel value={requestTabValue} index={4}>
                                    {pathParams.length > 0 ? <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: '#d4e6f1' }}>
                                                    <TableCell style={tableHeaderStyle} align='left'>{translate("NAME")}</TableCell>
                                                    <TableCell style={tableHeaderStyle} align='left'>{translate("TYPE")}</TableCell>
                                                    <TableCell style={tableHeaderStyle} align='left'>{translate("VALUE")}</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {pathParams.map((data, index) =>
                                                    <TableRowStyled key={index}>
                                                        <TableCell style={tableRowStyle} width={'33%'} align='left'>
                                                            <FormLabel data-testid="path-param-label">{data.name}</FormLabel>
                                                        </TableCell>
                                                        <TableCell style={tableRowStyle} width={'33%'} align='left'>
                                                            <FormLabel>{translate("String")}</FormLabel>
                                                        </TableCell>
                                                        <TableCell style={tableRowStyle} width={'33%'} align='left'>
                                                            <TextField name={"wm-webservice-param-value"} fullWidth data-testid="path-param-value" value={data.value} onChange={(e) => handlePathParamsChanges(e.target.value, index)} size='small' />
                                                        </TableCell>
                                                    </TableRowStyled>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer> :
                                        <Stack p={2} spacing={1} direction={'row'} sx={{ backgroundColor: "#d9edf7" }}>
                                            <InfoIcon sx={{ height: 18, width: 18, color: '#31708f', mt: 0.5 }} />
                                            <Stack>
                                                <Typography>
                                                    {translate('NO_PATH_PARAMS')}
                                                    {translate('NO_PATH_PARAMS_DESC')}
                                                </Typography>
                                                <Typography>
                                                    {`e.g. For URL "http:wavemaker.com/projects/{pid}/?mode=json", "pid" is the path param.`}
                                                    (<a href='https://docs.wavemaker.com/learn/app-development/services/web-services/rest-services/'>{translate("MORE_INFO")}</a>)
                                                </Typography>
                                            </Stack>
                                        </Stack>}
                                </CustomTabPanel>
                            </Box>
                        </Box>
                        <Box data-testid="response-block" sx={{ width: '100%' }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#f3f5f6' }}>
                                <Tabs value={responseTabValue} onChange={handleChangeResponseTabs}>
                                    <Tab label={translate("RESPONSE") + " " + translate("BODY")} />
                                    <Tab label={translate("RESPONSE") + " " + translate("HEADER")} />
                                </Tabs>
                            </Box>
                        </Box>
                        <div style={{ display: responseTabValue === 0 ? 'block' : 'none', width: '100%' }}>
                            <MonacoEditor monacoEditorHeight={restImportConfig?.responseBlockHeight as number} url={restImportConfig.monacoEditorURL} editorRef={editorRef} initialValue={JSON.stringify(response.data, undefined, 2) || undefined} initialLanguage={editorLanguage} />
                        </div>
                        {responseTabValue === 1 && <Stack overflow={'auto'} sx={{ backgroundColor: "rgb(40, 42, 54)", color: 'white' }} width={'100%'} direction={'row'}>
                            {response !== undefined && <TableContainer style={{ height: restImportConfig?.responseBlockHeight ? `${restImportConfig?.responseBlockHeight / 1.2}px` : '300px' }}>
                                <Table>
                                    <TableBody sx={{ padding: 40 }}>
                                        {Object.keys(response.headers as any).map((key) => {
                                            return <TableRow key={key}>
                                                <TableCell align='left' sx={{ color: 'white', width: '30%', borderBottom: 'none', padding: '5px' }}>
                                                    {key} :
                                                </TableCell>
                                                <TableCell align='left' sx={{ color: 'white', borderBottom: 'none', padding: '5px', width: '70%', wordWrap: 'break-word', wordBreak: 'break-word' }}>
                                                    {(response.headers as any)[key]}
                                                </TableCell>
                                            </TableRow>
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>}
                        </Stack>}
                    </Grid>
                </Grid>
                <ProviderModal handleToastError={handleToastError} handleOpen={providerOpen} handleClose={handleCloseProvider} proxyObj={restImportConfig} />
                <ConfigModel
                    handleOpen={configOpen}
                    handleClose={handleCloseConfig}
                    handleParentModalClose={handleCloseProvider}
                    providerConf={selectedProvider}
                    proxyObj={restImportConfig}
                    handleToastError={handleToastError}
                />
                <Snackbar sx={{ top: "0px !important", zIndex: 10000 }} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} open={handleToastOpen} autoHideDuration={restImportConfig.error.errorMessageTimeout} onClose={handleToastClose}>
                    <Alert data-testid={'alertMessage'} onClose={handleToastClose} severity={errorMessage?.type} sx={{ width: '100%' }}>
                        {errorMessage?.message}
                    </Alert>
                </Snackbar>
                <div style={{ position: 'relative', height: '0px' }}>
                    <TextField sx={{ position: 'absolute', left: -10000, top: -10000 }} data-testid="mock-response" value={responseTabValue === 0 ? response.data : JSON.stringify(response.headers)} disabled={true}></TextField>
                </div>
            </Stack>
        </ThemeProvider >
    )
}