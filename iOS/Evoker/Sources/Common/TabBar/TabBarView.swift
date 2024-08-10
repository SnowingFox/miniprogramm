//
//  TabBarView.swift
//
//  Copyright (c) Evoker. All rights reserved. (https://evokerdev.com)
//
//  This source code is licensed under The MIT license.
//

import Foundation
import UIKit

class TabBarView: UIView {
    
    var isShow = false
    
    var didSelectTabBarItemHandler: IntBlock?
    
    var tabBarItems: [TabBarItem] =  []
    
    let borderTopView = UIView()
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        
        backgroundColor = .white
        
        borderTopView.backgroundColor = UIColor(white: 0, alpha: 0.3)
        addSubview(borderTopView)
        borderTopView.autoPinEdgesToSuperviewEdges(with: .zero, excludingEdge: .bottom)
        borderTopView.autoSetDimension(.height, toSize: 1 / Constant.scale)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func load(config: AppConfig, envVersion: AppEnvVersion, version: String) {
        guard let tabBarInfo = config.tabBar else { return }
        
        backgroundColor = (tabBarInfo.backgroundColor ?? "#ffffff").hexColor()
        
        if tabBarInfo.borderStyle == .white {
            borderTopView.backgroundColor = UIColor(white: 1, alpha: 0.3)
        } else {
            borderTopView.backgroundColor = UIColor(white: 0, alpha: 0.3)
        }
        
        tabBarItems.forEach { $0.removeFromSuperview() }
        tabBarItems = []
        
        var prev: TabBarItem?
        let y = 1 / Constant.scale
        let height = 48 - y
        for (index, item) in tabBarInfo.list.enumerated() {
            let tabBarItem = TabBarItem(type: .custom)
            tabBarItem.tag = index
            tabBarItem.setTitle(item.text, for: .normal)
            tabBarItem.titleLabel?.font = UIFont.systemFont(ofSize: 10.0)
            tabBarItem.setTitleColor((tabBarInfo.color ?? "#353535").hexColor(), for: .normal)
            tabBarItem.setTitleColor((tabBarInfo.selectedColor ?? "#1989fa").hexColor(), for: .selected)
            if let iconPath = item.iconPath, !iconPath.isEmpty {
                let iconFile = FilePath.appStaticFilePath(appId: config.appId,
                                                          envVersion: envVersion,
                                                          version: version,
                                                          src: iconPath)
                let image = UIImage(contentsOfFile: iconFile.path)
                tabBarItem.setImage(image, for: .normal)
            }
            if let iconPath = item.selectedIconPath, !iconPath.isEmpty {
                let iconFile = FilePath.appStaticFilePath(appId: config.appId,
                                                          envVersion: envVersion,
                                                          version: version,
                                                          src: iconPath)
                let image = UIImage(contentsOfFile: iconFile.path)
                tabBarItem.setImage(image, for: .selected)
            }
            tabBarItem.addTarget(self, action: #selector(didSelectTab(_:)), for: .touchUpInside)
            
            addSubview(tabBarItem)
            tabBarItem.autoPinEdge(toSuperviewEdge: .top, withInset: y)
            tabBarItem.autoSetDimension(.height, toSize: height)
            if let prev = prev {
                tabBarItem.autoMatch(.width, to: .width, of: prev)
                tabBarItem.autoPinEdge(.left, to: .right, of: prev)
            } else {
                tabBarItem.autoPinEdge(toSuperviewEdge: .left)
            }
            if index == tabBarInfo.list.count - 1 {
                tabBarItem.autoPinEdge(toSuperviewEdge: .right)
            }
            prev = tabBarItem
            tabBarItems.append(tabBarItem)
        }
    }
    
    @objc
    func didSelectTab(_ item: UIButton) {
        tabBarItems.forEach { $0.isSelected = false }
        item.isSelected = true
        didSelectTabBarItemHandler?(item.tag)
    }
    
    func setTabItemSelected(_ index: Int) {
        guard index < tabBarItems.count else { return }
        tabBarItems.forEach { $0.isSelected = false }
        tabBarItems[index].isSelected = true
    }
    
    func add(to view: UIView) {
        guard superview != view else { return }
        removeFromSuperview()
        let height = Constant.tabBarHeight
        frame = CGRect(x: 0, y: view.frame.height - height, width: view.frame.width, height: height)
        view.addSubview(self)
    }
}
