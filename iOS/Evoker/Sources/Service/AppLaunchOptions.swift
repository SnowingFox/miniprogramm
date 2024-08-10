//
//  AppLaunchOptions.swift
//
//  Copyright (c) Evoker. All rights reserved. (https://evokerdev.com)
//  
//  This source code is licensed under The MIT license.
//

import Foundation

public enum AppEnvVersion: String, Codable {
    
    case develop
    
    case trail
    
    case release
  
}

public struct AppEnterReferrerInfo {
    
    let appId: String
    
    let extraDataString: String?
}

public protocol AppEnterOptions {
    
    var path: String { get set }
    
    var referrerInfo: AppEnterReferrerInfo? { get set }
    
}

public struct AppLaunchOptions: AppEnterOptions {
    
    /// 应用打开的路径
    public var path: String = ""
    
    public var referrerInfo: AppEnterReferrerInfo?
    
    public var envVersion: AppEnvVersion = .release
    
    public init() {
        
    }
}

public struct AppShowOptions: AppEnterOptions {
    
    public var path: String = ""
    
    public var referrerInfo: AppEnterReferrerInfo?
    
    public init() {
        
    }
}
