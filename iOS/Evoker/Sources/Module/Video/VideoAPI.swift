//
//  VideoAPI.swift
//
//  Copyright (c) Evoker. All rights reserved. (https://evokerdev.com)
//
//  This source code is licensed under The MIT license.
//

import Foundation

enum VideoAPI: String, CaseIterableAPI {
        
    case insertVideoPlayer
    case operateVideoPlayer
    
    func onInvoke(appService: AppService, bridge: JSBridge, args: JSBridge.InvokeArgs) {
        DispatchQueue.main.async {
            switch self {
            case .insertVideoPlayer:
                insertVideoPlayer(appService: appService, bridge: bridge, args: args)
            case .operateVideoPlayer:
                operateVideoPlayer(appService: appService, bridge: bridge, args: args)
            }
        }
    }
    
    private func insertVideoPlayer(appService: AppService, bridge: JSBridge, args: JSBridge.InvokeArgs) {
        guard let webView = bridge.container as? WebView else {
            let error = EKError.bridgeFailed(reason: .webViewNotFound)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let page = webView.page else {
            let error = EKError.bridgeFailed(reason: .pageNotFound)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard var params: VideoPlayerViewParams = args.paramsString.toModel() else {
            let error = EKError.bridgeFailed(reason: .jsonParseFailed)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let container = webView.findTongCengContainerView(tongcengId: params.parentId) else {
            let error = EKError.bridgeFailed(reason: .tongCengContainerViewNotFound(params.parentId))
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let module: VideoModule = appService.getModule() else {
            let error = EKError.bridgeFailed(reason: .moduleNotFound(VideoModule.name))
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        if !params.url.isEmpty {
            params._url = FilePath.srcToRealURL(appService: appService, src: params.url)
        }
        
        let playerView = VideoPlayerView(params: params)
        playerView.forceRotateScreen = { value in
            webView.page?.forceRotateScreen = value
        }
        playerView.player.loadedDataHandler = { duration, width, height in
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId,
                                          "duration": duration,
                                          "width": width,
                                          "height": height]
            webView.bridge.subscribeHandler(method: VideoPlayer.onLoadedDataSubscribeKey, data: message)
        }
        playerView.player.playHandler = {
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId]
            webView.bridge.subscribeHandler(method: VideoPlayer.onPlaySubscribeKey, data: message)
        }
        playerView.player.pauseHandler = {
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId]
            webView.bridge.subscribeHandler(method: VideoPlayer.onPauseSubscribeKey, data: message)
        }
        playerView.player.endedHandler = {
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId]
            webView.bridge.subscribeHandler(method: VideoPlayer.endedSubscribeKey, data: message)
        }
        playerView.player.timeUpdateHandler = { currentTime in
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId, "currentTime": currentTime]
            webView.bridge.subscribeHandler(method: VideoPlayer.timeUpdateSubscribeKey, data: message)
        }
        playerView.player.bufferUpdateHandler = { bufferTime in
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId, "bufferTime": bufferTime]
            webView.bridge.subscribeHandler(method: VideoPlayer.bufferUpdateSubscribeKey, data: message)
        }
        playerView.player.playFailedHandler = { error in
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId,
                                          "error": error]
            webView.bridge.subscribeHandler(method: VideoPlayer.onErrorSubscribeKey, data: message)
        }
        playerView.player.fullscreenChangeHandler = {
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId]
            webView.bridge.subscribeHandler(method: VideoPlayer.fullscreenChangeSubscribeKey, data: message)
        }
        playerView.player.seekCompletionHandler = { position in
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId, "position": position]
            webView.bridge.subscribeHandler(method: VideoPlayer.seekCompleteSubscribeKey, data: message)
        }
        playerView.player.waitingHandler = { isBufferLoading in
            let message: [String: Any] = ["videoPlayerId": params.videoPlayerId, "isBufferLoading": isBufferLoading]
            webView.bridge.subscribeHandler(method: VideoPlayer.waitingSubscribeKey, data: message)
        }
        container.addSubview(playerView)
        playerView.autoPinEdgesToSuperviewEdges()
        
        module.playerViews.set(page.pageId, params.videoPlayerId, value: playerView)
        
        bridge.invokeCallbackSuccess(args: args)
    }
    
    private func operateVideoPlayer(appService: AppService, bridge: JSBridge, args: JSBridge.InvokeArgs) {
        
        struct Params: Decodable {
            let videoPlayerId: Int
            let method: Method
            let data: Data
            
            enum Method: String, Decodable {
                case play
                case pause
                case remove
                case mute
                case fullscreen
                case changeURL
                case seek
                case replay
                case setPlaybackRate
            }
            
            enum Data: Decodable {
                case mute(MuteData)
                case fullscreen(FullscreenData)
                case seek(SeekData)
                case changeURL(ChangeURLData)
                case setPlaybackRate(SetPlaybackRateData)
                case unknown
                
                init(from decoder: Decoder) throws {
                    let container = try decoder.singleValueContainer()
                    if let data = try? container.decode(ChangeURLData.self) {
                        self = .changeURL(data)
                        return
                    }
                    if let data = try? container.decode(MuteData.self) {
                        self = .mute(data)
                        return
                    }
                    if let data = try? container.decode(FullscreenData.self) {
                        self = .fullscreen(data)
                        return
                    }
                    if let data = try? container.decode(SeekData.self) {
                        self = .seek(data)
                        return
                    }
                    if let data = try? container.decode(SetPlaybackRateData.self) {
                        self = .setPlaybackRate(data)
                        return
                    }
                    self = .unknown
                }
                
                struct MuteData: Decodable {
                    let muted: Bool
                }
                
                struct FullscreenData: Decodable {
                    let enter: Bool
                    let direction: Int
                }
                
                struct SeekData: Decodable {
                    let position: TimeInterval
                }
                
                struct ChangeURLData: Decodable {
                    let url: String
                    let objectFit: VideoPlayerViewParams.ObjectFit
                    let muted: Bool
                }
                
                struct SetPlaybackRateData: Decodable {
                    let rate: Float
                }

            }
        }

        guard let params: Params = args.paramsString.toModel() else {
            let error = EKError.bridgeFailed(reason: .jsonParseFailed)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let webView = bridge.container as? WebView else {
            let error = EKError.bridgeFailed(reason: .webViewNotFound)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let page = webView.page else {
            let error = EKError.bridgeFailed(reason: .pageNotFound)
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let module: VideoModule = appService.getModule() else {
            let error = EKError.bridgeFailed(reason: .moduleNotFound(VideoModule.name))
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        guard let playerView = module.playerViews.get(page.pageId, params.videoPlayerId) else {
            let error = EKError.bridgeFailed(reason: .videoPlayerIdNotFound(params.videoPlayerId))
            bridge.invokeCallbackFail(args: args, error: error)
            return
        }
        
        switch params.method {
        case .play:
            playerView.play()
        case .pause:
            playerView.pause()
        case .remove:
            playerView.stop()
            module.playerViews.remove(page.pageId, params.videoPlayerId)
        case .mute:
            if case .mute(let data) = params.data {
                playerView.player.isMuted = data.muted
            }
        case .fullscreen:
            if case .fullscreen(let data) = params.data {
                if data.enter {
                    var orientation: UIInterfaceOrientation
                    if data.direction == 0 {
                        orientation = .portrait
                    } else if data.direction == -90 {
                        orientation = .landscapeRight
                    } else if data.direction == 90 {
                        orientation = .landscapeLeft
                    } else {
                        orientation = .landscapeRight
                    }
                    playerView.enterFullscreen(orientation: orientation)
                } else {
                    playerView.quiteFullscreen()
                }
            }
        case .changeURL:
            if case .changeURL(let data) = params.data {
                let src = data.url
                playerView.params.url = src
                playerView.params.objectFit = data.objectFit
                playerView.params.muted = data.muted
                if !src.isEmpty {
                    if let url = FilePath.ekFilePathToRealFilePath(appId: appService.appId, filePath: src) ?? URL(string: src) {
                        playerView.setURL(url)
                    }
                } else {
                    playerView.params._url = nil
                    playerView.player.reset()
                }
            }
        case .seek:
            if case .seek(let data) = params.data {
                playerView.seek(position: data.position)
            }
        case .replay:
            playerView.player.replay()
        case .setPlaybackRate:
            if case .setPlaybackRate(let data) = params.data {
                playerView.player.setPlaybackRate(data.rate)
            }
        }
       
        bridge.invokeCallbackSuccess(args: args)
    }
}
