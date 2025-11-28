import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

// Bước 1: Tạo "cái hộp" Context
// Dòng này tạo ra một đối tượng Context. Nó giống như việc xây dựng một cái hộp rỗng.
export const AuthContext = createContext(null);

// Bước 2: Tạo "Người Quản Lý" cho cái hộp đó
// Đây là một component đặc biệt (gọi là Provider) có nhiệm vụ quản lý và chia sẻ dữ liệu.
export const AuthProvider = ({ children }) => {
    // State để lưu thông tin người dùng hiện tại
    const [currentUser, setCurrentUser] = useState(null);
    // State để biết ứng dụng đã kiểm tra token xong chưa (tránh màn hình bị giật)
    const [isLoading, setIsLoading] = useState(true);

    // Hàm để cập nhật thông tin người dùng.
    // Chúng ta dùng useCallback để tối ưu, đảm bảo hàm này không bị tạo lại một cách không cần thiết.
    const updateUser = useCallback((token) => {
        try {
            // Giải mã token để lấy thông tin người dùng (id, name, role...)
            const decodedUser = jwtDecode(token);
            
            // Kiểm tra xem token có còn hạn sử dụng không
            if (decodedUser.exp * 1000 > Date.now()) {
                // Nếu còn hạn, lưu token vào localStorage và cập nhật state currentUser
                localStorage.setItem('token', token);
                setCurrentUser(decodedUser);
            } else {
                // Nếu hết hạn, gọi hàm đăng xuất
                logout();
            }
        } catch (error) {
            console.error("Lỗi giải mã token:", error);
            logout(); // Nếu token lỗi, cũng đăng xuất cho an toàn
        }
    }, []);

    // Hàm để đăng xuất
    const logout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        // Chuyển hướng về trang chủ để làm mới hoàn toàn trạng thái ứng dụng
        window.location.href = '/';
    };

    // Hàm này sẽ chạy MỘT LẦN DUY NHẤT khi ứng dụng được tải lần đầu
    useEffect(() => {
        // Lấy token từ localStorage (nếu có)
        const token = localStorage.getItem('token');
        if (token) {
            // Nếu có token, dùng hàm updateUser để khôi phục phiên đăng nhập
            updateUser(token);
        }
        // Đánh dấu là đã kiểm tra xong, để ứng dụng có thể render
        setIsLoading(false);
    }, [updateUser]); // Phụ thuộc vào updateUser

    // Bước 3: Đóng gói những thứ cần chia sẻ
    // Chúng ta tạo một đối tượng chứa state và các hàm mà chúng ta muốn các component khác có thể dùng.
    const value = { currentUser, isLoading, updateUser, logout };

    // Bước 4: Cung cấp dữ liệu cho các component con
    return (
        <AuthContext.Provider value={value}>
            {/* Chỉ render các component con (`children`) khi đã kiểm tra token xong */}
            {!isLoading && children}
        </AuthContext.Provider>
    );
};