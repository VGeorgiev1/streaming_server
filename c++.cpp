#include <iostream>
using namespace std;
int main () {
    int broi = 1;
    string code;
    string code2 = "";
    cin >> code;
    int i2 = 0;
    int i;
    for (i = 0; i < code.size(); i++)
    {
        if (code[i]== code[i + 1]) {
            broi++;
        } else {
            if (broi != 1)
            {
                int seqLng = 1;
                while(broi / 10 != 0){
                    seqLng++;
                    broi /=10;
                }
                i2 += seqLng;
            }
            i2++;
            broi = 1;
        }
    }
    cout << i - i2 <<endl;

}