LOG_ON = True # show error logging during training
LOG_FREQ = 10000 # show the logs every <<

"""
NEURAL NETWORK
"""
class NeuralNetwork:
    def __init__(numInputs, numHidden, numOutputs):
        self._inputs = []


"""
MATRIX FUNCTIONS
"""
class Matrix:
    # Constructor
    def __init__(rows, cols, data = []):
        self._rows = rows
        self._cols = cols
        self._data = data

        # Initialize with zeroes if no data given
        if data is None or !len(data):
            self._data = []
            for i in range(0,self._rows):
                self._data[i] = []
                for j in range(0,self._cols):
                    self._data[i][j] = 0
        else:
            # check data integrity
            if len(data) != rows or len(data[0]) != cols:
                raise Exception("Incorrect Dimensions")
