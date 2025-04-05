if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app="controller.auth_controller:app", host="localhost", port=8000, reload=True)
