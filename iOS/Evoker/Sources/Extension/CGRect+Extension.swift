//
//  CGRect+Extension.swift
//
//  Copyright (c) Evoker. All rights reserved. (https://evokerdev.com)
//
//  This source code is licensed under The MIT license.
//

import Foundation
import UIKit

extension CGRect {
    
    func toDict() -> [String: CGFloat] {
        return ["x": origin.x, "y": origin.y, "width": size.width, "height": size.height]
    }
}
