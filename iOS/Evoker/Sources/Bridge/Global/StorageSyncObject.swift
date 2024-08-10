//
//  StorageSyncObject.swift
//
//  Copyright (c) Evoker. All rights reserved. (https://evokerdev.com)
//  
//  This source code is licensed under The MIT license.
//

import Foundation
import JavaScriptCore

@objc protocol StorageSyncObjectExport: JSExport {
    
    init()
    
    func getStorageSync(_ key: String) -> [String: Any]
    
    func setStorageSync(_ key: String, _ data: String, _ dataType: String) -> [String: Any]
    
    func getStorageInfoSync() -> [String: Any]
    
    func removeStorageSync(_ key: String) -> [String: Any]
    
    func clearStorageSync() -> [String: Any]
}

@objc class StorageSyncObject: NSObject, StorageSyncObjectExport {
        
    weak var appService: AppService?
    
    override required init() {
        super.init()
    }
    
    func getStorageSync(_ key: String) -> [String: Any] {
        if let appService = appService {
            let (result, error) = appService.storage.get(key: key)
            if let result = result {
                return ["result": ["data": result.0, "dataType": result.1]]
            } else if let error = error {
                return ["errMsg": error.localizedDescription]
            }
        }
        return ["errMsg": EKError.bridgeFailed(reason: .appServiceNotFound).localizedDescription]
    }
    
    func setStorageSync(_ key: String, _ data: String, _ dataType: String) -> [String: Any] {
        if let appService = appService {
            if let error = appService.storage.set(key: key, data: data, dataType: dataType) {
                return ["errMsg": error.localizedDescription]
            } else {
                return [:]
            }
        }
        return ["errMsg": EKError.bridgeFailed(reason: .appServiceNotFound).localizedDescription]
    }
    
    func getStorageInfoSync() -> [String: Any] {
        if let appService = appService {
            let (result, error) = appService.storage.info()
            if let (keys, size, limit) = result {
                return ["result": ["keys": keys, "currentSize": size, "limitSize": limit]]
            } else if let error = error {
                return ["errMsg": error.localizedDescription]
            }
        }
        return ["errMsg": EKError.bridgeFailed(reason: .appServiceNotFound).localizedDescription]
    }
    
    func removeStorageSync(_ key: String) -> [String: Any] {
        if let appService = appService {
            let error = appService.storage.remove(key: key)
            if let error = error {
                return ["errMsg": error.localizedDescription]
            }
            return [:]
        }
        return ["errMsg": EKError.bridgeFailed(reason: .appServiceNotFound).localizedDescription]
    }
    
    func clearStorageSync() -> [String: Any] {
        if let appService = appService {
            let error = appService.storage.clear()
            if let error = error {
                return ["errMsg": error.localizedDescription]
            }
            return [:]
        }
        return ["errMsg": EKError.bridgeFailed(reason: .appServiceNotFound).localizedDescription]
    }
}
