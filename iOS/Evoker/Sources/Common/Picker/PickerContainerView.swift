//
//  PickerContainerView.swift
//
//  Copyright (c) Evoker. All rights reserved. (https://evokerdev.com)
//
//  This source code is licensed under The MIT license.
//

import Foundation
import UIKit

class PickerContainerView: UIView, TransitionView {
    
    let toolView = UIView()
    let cancelButton = UIButton()
    let confirmButton = UIButton()
    let titleLabel = UILabel()
    
    var onConfirmHandler: EmptyBlock?
    var onCancelHandler: EmptyBlock?
    
    init(picker: UIView) {
        super.init(frame: .zero)
        
        if #available(iOS 13.0, *) {
            backgroundColor = .secondarySystemBackground
            toolView.backgroundColor = .secondarySystemBackground
        } else {
            backgroundColor = .white
            toolView.backgroundColor = .white
        }
        
        addSubview(picker)
        picker.autoPinEdgesToSuperviewEdges(with: .zero, excludingEdge: .top)

        addSubview(toolView)
        toolView.autoPinEdgesToSuperviewEdges(with: .zero, excludingEdge: .bottom)
        toolView.autoSetDimension(.height, toSize: 44)
        toolView.autoPinEdge(.bottom, to: .top, of: picker)
        
        cancelButton.setTitle("取消", for: .normal)
        cancelButton.setTitleColor(.systemGray, for: .normal)
        cancelButton.titleLabel?.font = UIFont.systemFont(ofSize: 16.0)
        cancelButton.addTarget(self, action: #selector(_onCancel), for: .touchUpInside)
        toolView.addSubview(cancelButton)
        cancelButton.autoPinEdge(toSuperviewEdge: .left, withInset: 15)
        cancelButton.autoAlignAxis(toSuperviewAxis: .horizontal)
        
        confirmButton.setTitle("确定", for: .normal)
        confirmButton.setTitleColor(.systemBlue, for: .normal)
        confirmButton.titleLabel?.font = UIFont.systemFont(ofSize: 16.0)
        confirmButton.addTarget(self, action: #selector(_onConfirm), for: .touchUpInside)
        toolView.addSubview(confirmButton)
        confirmButton.autoPinEdge(toSuperviewEdge: .right, withInset: 15)
        confirmButton.autoAlignAxis(toSuperviewAxis: .horizontal)
        
        if #available(iOS 13.0, *) {
            titleLabel.textColor = .label
        } else {
            titleLabel.textColor = .black
        }
        toolView.addSubview(titleLabel)
        titleLabel.autoAlignAxis(toSuperviewAxis: .horizontal)
        titleLabel.autoAlignAxis(toSuperviewAxis: .vertical)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    @objc func _onCancel() {
        onCancelHandler?()
    }
    
    @objc func _onConfirm() {
        onConfirmHandler?()
    }
    
    func show(to view: UIView) {
        let width = view.frame.width
        let height = width
        frame = CGRect(x: 0, y: view.frame.height - height, width: width, height: height)
        view.addSubview(self)
        popup()
    }
    
    func hide() {
        popdown {
            self.removeFromSuperview()
        }
    }
}
